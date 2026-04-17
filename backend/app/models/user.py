from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from app.models.complaint import generate_uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone_encrypted = Column(String, nullable=False, unique=True)
    role = Column(String, default="citizen") # citizen, officer, admin, councillor
    otp_hash = Column(String, nullable=True)
    jwt_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
