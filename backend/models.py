# models.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class MediaRecord(SQLModel, table=True):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )

    filename: str
    owner_id: str  # From auth system (e.g. Keycloak)

    # Workflow state
    status: str = "PROCESSING"  # PROCESSING | COMPLETED | FAILED

    # Storage
    s3_key: str

    # Results
    transcript: Optional[str] = None
    summary: Optional[str] = None

    # Accounting
    tokens: int = 0

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
