import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID


from app.core.database import Base

# We will use String(36) as a fallback for UUIDs to maintain SQLite compatibility during local dev testing
def generate_uuid():
    return str(uuid.uuid4())

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_text = Column(String, nullable=True)
    anonymised_text = Column(String, nullable=True)
    category = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    department = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(String, default="pending") # pending, assigned, en_route, in_progress, resolved
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=True) 
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=True) 
    cluster_id = Column(String(36), nullable=True)
    source = Column(String, nullable=True) # 'whatsapp' or 'discord'

    # Relationships
    citizen = relationship("User", foreign_keys=[citizen_id])
    officer = relationship("User", foreign_keys=[officer_id])


    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    cpgrams_ref = Column(String, nullable=True)
