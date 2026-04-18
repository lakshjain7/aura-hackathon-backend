import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Community(Base):
    __tablename__ = "communities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    link = Column(String, nullable=False)
    members_count = Column(Integer, default=0)
    topic = Column(String, nullable=True) # e.g., "Sanitation & Roads"
    suburb = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
