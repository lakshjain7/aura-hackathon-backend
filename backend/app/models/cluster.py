from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.core.database import Base
from app.models.complaint import generate_uuid

class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_ids = Column(String) # Storing CSV of IDs for SQLite compatibility, or use JSON/ARRAY in postgres
    category = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    count = Column(Integer, default=0)
    flagged_as_systemic = Column(Boolean, default=False)
    proactive_alert_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
