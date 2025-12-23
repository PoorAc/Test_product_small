import os
import io
from temporalio import activity
from minio import Minio
from sqlmodel import Session, create_engine, select
from models import MediaRecord
from openai import OpenAI

from dotenv import load_dotenv

load_dotenv(".env.local")

user = os.environ["POSTGRES_USER"]
password = os.environ["POSTGRES_PASSWORD"]
db = os.environ["POSTGRES_DB"]

# Setup internal clients
storage_client = Minio(
    "minio.project.demo",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

engine = create_engine(f"postgresql://{user}:{password}@db:5432/{db}")
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in environment variables!")

ai_client = OpenAI(api_key=api_key)

class MediaActivities:
    @activity.defn
    async def download_from_minio(self, s3_key: str) -> str:
        """Downloads the file to a local temp path for processing"""
        local_path = f"/tmp/{os.path.basename(s3_key)}"
        storage_client.fget_object("media-vault", s3_key, local_path)
        return local_path

    @activity.defn
    async def transcribe_audio(self, local_path: str) -> str:
        """Uses OpenAI Whisper to turn audio/video into text"""
        with open(local_path, "rb") as audio_file:
            transcript = ai_client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        # Cleanup local file after transcription to save space
        if os.path.exists(local_path):
            os.remove(local_path)
        return transcript.text

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
    async def update_db_status(self, data: dict) -> str:
        """Updates the PostgreSQL record with the results"""
        with Session(engine) as session:
            statement = select(MediaRecord).where(MediaRecord.id == data["file_id"])
            record = session.exec(statement).one()
            
            record.transcript = data["transcript"]
            record.summary = data["summary"]
            record.status = data["status"]
            # Example token count logic
            record.tokens = len(data["transcript"].split()) 
            
            session.add(record)
            session.commit()
        return "Database Updated"