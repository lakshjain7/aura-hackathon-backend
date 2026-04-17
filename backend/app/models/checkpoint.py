from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from app.models.complaint import generate_uuid

class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), nullable=False) # Foreign key representation
    stage = Column(String, nullable=False) # accepted, en_route, arrived, in_progress, resolved
    image_url = Column(String, nullable=True) # Proof of work
    raw_notes = Column(String, nullable=True) # What the worker typed
    citizen_summary = Column(String, nullable=True) # What the AI converted it into for the community
    timestamp = Column(DateTime, default=datetime.utcnow)
