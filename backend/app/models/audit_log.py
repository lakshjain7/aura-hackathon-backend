from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from app.models.complaint import generate_uuid

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), nullable=True)
    action = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    details = Column(String, nullable=True) # Storing JSON as string for SQLite compat
    timestamp = Column(DateTime, default=datetime.utcnow)
