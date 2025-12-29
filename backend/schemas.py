from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# -----------------------------
# History list (lightweight)
# -----------------------------
class MediaHistoryItem(BaseModel):
    id: str
    filename: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# -----------------------------
# Media details (expanded view)
# -----------------------------
class MediaDetails(BaseModel):
    id: str
    filename: str
    status: str
    transcript: Optional[str]
    summary: Optional[str]
    tokens: int
    created_at: datetime

    class Config:
        from_attributes = True
