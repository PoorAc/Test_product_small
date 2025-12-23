import uuid
import io
import os
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, Depends, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
from sqlmodel import SQLModel, Field, Session, select, create_engine
from temporalio.client import Client as TemporalClient

# Import your workflow definition
from workflow import MediaProcessingWorkflow

# --- 1. CONFIGURATION ---
from dotenv import load_dotenv

load_dotenv(".env.local")

user = os.environ["POSTGRES_USER"]
password = os.environ["POSTGRES_PASSWORD"]
db = os.environ["POSTGRES_DB"]

DATABASE_URL = f"postgresql://{user}:{password}@db:5432/{db}"
engine = create_engine(DATABASE_URL)

storage_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

# Global Temporal Client holder
temporal_state = {"client": None}

# --- 2. THE LIFESPAN HANDLER ---
# Define this BEFORE creating the FastAPI app instance
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB
    SQLModel.metadata.create_all(engine)
    
    # Ensure MinIO bucket exists
    if not storage_client.bucket_exists("media-vault"):
        storage_client.make_bucket("media-vault")
    
    # Connect to Temporal Server
    try:
        temporal_state["client"] = await TemporalClient.connect("localhost:7233")
        print("✅ Connected to Temporal Server")
    except Exception as e:
        print(f"❌ Could not connect to Temporal: {e}")
    
    yield
    # Shutdown logic goes here if needed

# --- 3. INITIALIZE APP ---
app = FastAPI(title="DurableAI Backend", lifespan=lifespan)

# --- 4. MODELS & MIDDLEWARE ---
class MediaRecord(SQLModel, table=True):
    # This tells SQLAlchemy to reuse the table if it already exists
    __table_args__ = {"extend_existing": True} 

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str
    owner_id: str
    status: str = "PROCESSING"
    s3_key: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    tokens: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    with Session(engine) as session:
        yield session

# --- 5. API ENDPOINTS ---

@app.post("/process-media")
async def upload_media(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    user_id = "test-user-123" 
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{user_id}/{file_id}-{file.filename}"

    try:
        # Stream to MinIO
        file_data = await file.read()
        storage_client.put_object(
            "media-vault", s3_key, io.BytesIO(file_data), len(file_data),
            content_type=file.content_type
        )

        # Create DB Entry
        new_record = MediaRecord(id=file_id, filename=file.filename, owner_id=user_id, s3_key=s3_key)
        session.add(new_record)
        session.commit()

        # Trigger Temporal
        client = temporal_state["client"]
        if client:
            await client.start_workflow(
                MediaProcessingWorkflow.run,
                args=[s3_key, file_id],
                id=f"media-wf-{file_id}",
                task_queue="media-task-queue",
            )

        return {"status": "success", "file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[MediaRecord])
async def get_history(session: Session = Depends(get_session)):
    statement = select(MediaRecord).order_by(MediaRecord.created_at.desc())
    return session.exec(statement).all()

@app.get("/media/{file_id}/results", response_model=MediaRecord)
async def get_results(file_id: str, session: Session = Depends(get_session)):
    record = session.get(MediaRecord, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    return record

@app.delete("/media/{file_id}")
async def delete_media(file_id: str, session: Session = Depends(get_session)):
    record = session.get(MediaRecord, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    
    try:
        storage_client.remove_object("media-vault", record.s3_key)
    except:
        pass

    session.delete(record)
    session.commit()
    return {"status": "deleted"}