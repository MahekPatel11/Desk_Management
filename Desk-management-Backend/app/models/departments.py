from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    floor_id = Column(String(36), ForeignKey("floors.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

