import os
from temporalio import activity
from minio import Minio
import whisper
import torch
from openai import OpenAI
from sqlmodel import Session, select
import tempfile
import uuid
import subprocess
import httpx
import re
from collections import Counter

from database import engine
from models import MediaRecord
from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MEDIA_BUCKET,
    SUMMARIZER_URL
)


storage_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

_whisper_model = None

def get_whisper_model():
    global _whisper_model

    if _whisper_model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

        activity.logger.info(
            f"Loading Whisper model on device={device}"
        )

        _whisper_model = whisper.load_model(
            "medium",
            device=device,
        )

    return _whisper_model

def is_coherent_transcript(text: str) -> bool:
    """
    Lightweight heuristic to detect whether a transcript
    has enough semantic structure to summarize.
    """

    if not text:
        return False

    words = re.findall(r"\b\w+\b", text.lower())
    if len(words) < 40:
        return False

    unique_ratio = len(set(words)) / len(words)
    if unique_ratio < 0.35:
        return False

    sentence_count = text.count(".") + text.count("?") + text.count("!")
    if sentence_count < 2:
        return False

    most_common = Counter(words).most_common(1)[0][1]
    if most_common / len(words) > 0.2:
        return False

    return True


class MediaActivities:
    @activity.defn
    async def download_from_minio(self, s3_key: str) -> str:
        """
        Downloads the file to a unique local temp path.
        """
        print("Downloading from minio")
        temp_dir = tempfile.mkdtemp(prefix="media_")
        filename = f"{uuid.uuid4()}_{os.path.basename(s3_key)}"
        local_path = os.path.join(temp_dir, filename)

        storage_client.fget_object(MEDIA_BUCKET, s3_key, local_path)

        activity.logger.info(f"Downloaded {s3_key} → {local_path}")
        return local_path
    
    @activity.defn
    async def preprocess_audio(self, input_path: str) -> dict:
        """
        Cleans and converts audio to WAV using ffmpeg.
        """
        print("Cleaning the file")
        output_path = f"{os.path.dirname(input_path)}/clean_{uuid.uuid4()}.wav"

        cmd = [
            "ffmpeg",
            "-y",                     # overwrite if exists
            "-i", input_path,
            "-af", "highpass=200, lowpass=3000",
            output_path,
        ]

        activity.logger.info(f"Running ffmpeg: {' '.join(cmd)}")

        try:
            subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
        except subprocess.CalledProcessError as err:
            activity.logger.error(err.stderr.decode())
            raise RuntimeError("Audio preprocessing failed")

        return {
                "input_path": input_path,
                "clean_path": output_path,
            }


    @activity.defn
    async def transcribe_audio(self, data: dict) -> dict:
        """
        Transcribes the audio and deletes all temporary files.
        """
        print("Transcribing the audio")
        
        input_path = data["input_path"]
        clean_path = data["clean_path"]

        model = get_whisper_model()

        activity.logger.info(f"Transcribing {clean_path}")

        result = model.transcribe(
            clean_path,
            language="en",
            fp16=False,
            condition_on_previous_text=False,
        )

        transcript = ""
        for seg in result["segments"]:
            transcript += (
                f"[{seg['start']:7.2f} → {seg['end']:7.2f}] "
                f"{seg['text']}\n"
            )

        # ✅ cleanup ONLY after success
        print("Deleting files")
        for path in (clean_path, input_path):
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass

        return {
                "transcript" : transcript,
                "text" : result["text"]
            }



    @activity.defn
    async def summarize_transcript(self, texts: dict) -> str:
        """
        Summarizes the transcript using a local llm model
        """
        
        print("Summarizing transcript")
        
        transcript = texts["transcript"]
        text = texts["text"]
        
        if not is_coherent_transcript(text):
            activity.logger.info(
                "Transcript deemed incoherent — skipping summarization"
            )
            return (
                "The transcript does not form a coherent or meaningful narrative."
            )

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                SUMMARIZER_URL,
                json={"text": text},
            )
            resp.raise_for_status()
            return resp.json()["summary"]


    @activity.defn
    async def update_db_status(self, data: dict) -> None:
        """Idempotently update media job status and results."""
        print("Updating results")
        with Session(engine) as session:
            statement = select(MediaRecord).where(MediaRecord.id == data["file_id"])
            record = session.exec(statement).one_or_none()

            if not record:
                activity.logger.error(
                    f"MediaRecord not found: {data['file_id']}"
                )
                return

            # Idempotency guard
            if record.status == "COMPLETED":
                activity.logger.info(
                    f"MediaRecord {record.id} already COMPLETED — skipping update"
                )
                return

            record.transcript = data["transcript"]
            record.summary = data["summary"]
            record.status = data["status"]
            record.tokens = len(data["transcript"].split())

            session.add(record)
            session.commit()

    @activity.defn
    async def mark_failed(self, data: dict) -> None:
        print("Transcription failed")
        file_id = data["file_id"]
        reason = data.get("reason")

        with Session(engine) as session:
            statement = select(MediaRecord).where(MediaRecord.id == file_id)
            record = session.exec(statement).one_or_none()

            if not record:
                return

            if record.status == "FAILED":
                return

            record.status = "FAILED"
            session.add(record)
            session.commit()

        if reason:
            activity.logger.error(
                f"Media job {file_id} failed: {reason}"
            )

