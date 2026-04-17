from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from app.models.complaint import generate_uuid

class Correction(Base):
    __tablename__ = "corrections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), nullable=False)
    original_category = Column(String, nullable=True)
    original_dept = Column(String, nullable=True)
    corrected_category = Column(String, nullable=False)
    corrected_dept = Column(String, nullable=False)
    officer_id = Column(String(36), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
