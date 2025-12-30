# database.py
import os
from sqlmodel import SQLModel, Session, create_engine

from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=False,          
    pool_pre_ping=True   
)

def init_db() -> None:
    """Create tables (called once at startup)."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """FastAPI / general-purpose session dependency."""
    with Session(engine) as session:
        yield session
