from dataclasses import dataclass
from typing import Optional

@dataclass
class MediaInput:
    """The initial data sent from FastAPI to start a workflow."""
    file_id: str        # Unique ID for the database
    file_name: str      # Original name (e.g., "vacation.mp4")
    user_id: str        # Keycloak User ID
    s3_key: str         # The path where the file is stored in MinIO

@dataclass
class ProcessingResult:
    """The final data returned by the workflow."""
    transcript: str
    summary: str
    vector_id: str      # ID of the entry in Milvus
    status: str = "COMPLETED"