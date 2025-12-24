import uuid
import io
import os
from contextlib import asynccontextmanager
from typing import List
from sqlmodel import Session, select
from fastapi import FastAPI, UploadFile, Depends, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
from temporalio.client import Client as TemporalClient

from workflow import MediaProcessingWorkflow
from models import MediaRecord
from database import get_session, init_db
from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MEDIA_BUCKET,
    TEMPORAL_ENDPOINT,
    TEMPORAL_NAMESPACE,
    MEDIA_TASK_QUEUE,
)

storage_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

# Global Temporal Client holder
temporal_state = {"client": None}

# --- 2. THE LIFESPAN HANDLER ---
# Define this BEFORE creating the FastAPI app instance
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB
    init_db()
    
    # Ensure MinIO bucket exists
    if not storage_client.bucket_exists(MEDIA_BUCKET):
        storage_client.make_bucket(MEDIA_BUCKET)
    
    # Connect to Temporal Server
    try:
        temporal_state["client"] = await TemporalClient.connect(
                                        TEMPORAL_ENDPOINT,
                                        namespace=TEMPORAL_NAMESPACE
                                    )

        print("✅ Connected to Temporal Server")
    except Exception as e:
        print(f"❌ Could not connect to Temporal: {e}")
    
    yield
    # Shutdown logic goes here if needed

# --- 3. INITIALIZE APP ---
app = FastAPI(title="DurableAI Backend", lifespan=lifespan)

# --- 4. MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. API ENDPOINTS ---

@app.post("/process-media")
async def upload_media(
    files: List[UploadFile] = File(...),
    session: Session = Depends(get_session),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    user_id = "test-user-123"  # will come from auth later
    client = temporal_state["client"]

    if not client:
        raise HTTPException(
            status_code=503,
            detail="Temporal client not available",
        )

    results = []

    for file in files:
        if not file.content_type or not (
            file.content_type.startswith("audio/")
            or file.content_type.startswith("video/")
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid media type: {file.filename}",
            )

        file_id = str(uuid.uuid4())
        s3_key = f"uploads/{user_id}/{file_id}-{file.filename}"

        try:
            # ---- Upload to MinIO ----
            file_data = await file.read()

            storage_client.put_object(
                MEDIA_BUCKET,
                s3_key,
                io.BytesIO(file_data),
                length=len(file_data),
                content_type=file.content_type,
            )

            # ---- Create DB record ----
            record = MediaRecord(
                id=file_id,
                filename=file.filename,
                owner_id=user_id,
                s3_key=s3_key,
                status="PROCESSING",
            )

            session.add(record)
            session.commit()

            # ---- Start Temporal workflow ----
            handle = await client.start_workflow(
                MediaProcessingWorkflow.run,
                args=[s3_key, file_id],
                id=f"media-wf-{file_id}",
                task_queue=MEDIA_TASK_QUEUE,
            )

            results.append(
                {
                    "file_id": file_id,
                    "filename": file.filename,
                    "workflow_id": handle.id,
                    "status": "PROCESSING",
                }
            )

        except Exception as err:
            session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process {file.filename}: {err}",
            )

    return {
        "count": len(results),
        "items": results,
    }


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
        storage_client.remove_object(MEDIA_BUCKET, record.s3_key)
    except:
        pass

    session.delete(record)
    session.commit()
    return {"status": "deleted"}