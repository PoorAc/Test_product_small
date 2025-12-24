import os
from temporalio import activity
from minio import Minio
from openai import OpenAI
from sqlmodel import Session, select
import tempfile
import uuid

from database import engine
from models import MediaRecord
from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MEDIA_BUCKET,
    OPENAI_API_KEY,
)

storage_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set")

ai_client = OpenAI(api_key=OPENAI_API_KEY)

class MediaActivities:
    @activity.defn
    async def download_from_minio(self, s3_key: str) -> str:
        """Downloads the file to a unique local temp path."""
        temp_dir = tempfile.mkdtemp(prefix="media_")
        filename = f"{uuid.uuid4()}_{os.path.basename(s3_key)}"
        local_path = os.path.join(temp_dir, filename)

        storage_client.fget_object(MEDIA_BUCKET, s3_key, local_path)

        activity.logger.info(f"Downloaded {s3_key} → {local_path}")
        return local_path

    @activity.defn
    async def transcribe_audio(self, local_path: str) -> str:
        """Uses OpenAI Whisper to turn audio/video into text."""
        try:
            with open(local_path, "rb") as audio_file:
                transcript = ai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )

            return transcript.text

        finally:
            # Always clean up, even on failure or retry
            try:
                if os.path.exists(local_path):
                    os.remove(local_path)

                parent_dir = os.path.dirname(local_path)
                if os.path.isdir(parent_dir):
                    os.rmdir(parent_dir)

            except Exception as cleanup_err:
                activity.logger.warning(
                    f"Failed to clean temp files: {cleanup_err}"
                )

    @activity.defn
    async def summarize_transcript(self, transcript: str) -> str:
        """Uses GPT-4o to summarize the transcript"""
        response = ai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes media transcripts."},
                {"role": "user", "content": f"Summarize this transcript concisely: {transcript}"}
            ]
        )
        return response.choices[0].message.content

    @activity.defn
    async def update_db_status(self, data: dict) -> None:
        """Idempotently update media job status and results."""
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
    async def mark_failed(self, file_id: str, reason: str | None = None) -> None:
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
