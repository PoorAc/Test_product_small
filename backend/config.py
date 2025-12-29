# config.py
import os
from dotenv import load_dotenv

load_dotenv("../.env")

# --- Database ---
POSTGRES_USER = os.environ["POSTGRES_USER"]
POSTGRES_PASSWORD = os.environ["POSTGRES_PASSWORD"]
POSTGRES_DB = os.environ["POSTGRES_DB"]

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@db:5432/{POSTGRES_DB}"
)

# --- Temporal ---
TEMPORAL_ENDPOINT = os.getenv("TEMPORAL_ENDPOINT", "temporal:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
MEDIA_TASK_QUEUE = os.getenv("MEDIA_TASK_QUEUE", "media-task-queue")

# --- MinIO / S3 ---
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MEDIA_BUCKET = os.getenv("MEDIA_BUCKET", "media-vault")

# --- OpenAI ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
