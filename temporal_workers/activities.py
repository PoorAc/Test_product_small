import os
import asyncio
from temporalio import activity
from minio import Minio
from pymilvus import MilvusClient, model
from shared.models import MediaInput

# 1. Initialize Clients (Use environment variables for Docker)
MINIO_CLIENT = Minio(
    os.getenv("MINIO_ENDPOINT", "minio:9000"),
    access_key=os.getenv("MINIO_ROOT_USER", "minioadmin"),
    secret_key=os.getenv("MINIO_ROOT_PASSWORD", "minioadmin"),
    secure=False
)

MILVUS_CLIENT = MilvusClient(uri=os.getenv("MILVUS_URI", "http://milvus:19530"))
# Using Milvus built-in embedding model utility
embedding_fn = model.DefaultEmbeddingFunction()

@activity.defn
async def extract_thumbnail(input: MediaInput) -> str:
    """Simulates extracting a thumbnail from a video file in MinIO."""
    activity.heartbeat("Downloading file for thumbnail...")
    # Logic: Get file from MinIO -> Use ffmpeg -> Upload thumbnail to MinIO
    thumbnail_path = f"thumbnails/{input.file_id}.jpg"
    print(f"--- Activity: Extracted thumbnail to {thumbnail_path} ---")
    return thumbnail_path

@activity.defn
async def transcribe_media(input: MediaInput) -> str:
    """Simulates heavy AI transcription."""
    activity.heartbeat("Transcribing audio...")
    # Logic: Get file from MinIO -> Send to Whisper/AI -> Return text
    await asyncio.sleep(2)  # Simulating processing time
    transcript = f"This is the AI-generated transcript for {input.file_name}."
    print(f"--- Activity: Transcription complete ---")
    return transcript

@activity.defn
async def store_in_milvus(transcript: str) -> str:
    """Turns text into a vector and stores it in Milvus."""
    # 1. Create embedding (Vectorizing)
    vectors = embedding_fn.encode_queries([transcript])
    
    # 2. Insert into Milvus collection
    # Note: You'd typically ensure the collection exists first
    collection_name = "media_transcripts"
    data = [{"vector": vectors[0], "text": transcript}]
    
    res = MILVUS_CLIENT.insert(collection_name=collection_name, data=data)
    return str(res['ids'][0])