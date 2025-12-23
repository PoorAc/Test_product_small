from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class MediaRecord(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str
    owner_id: str  # From Keycloak Token
    status: str = "PROCESSING"  # PROCESSING, COMPLETED, FAILED
    s3_key: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)