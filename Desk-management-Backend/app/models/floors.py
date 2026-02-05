from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime

from app.database.database import Base


class Floor(Base):
    __tablename__ = "floors"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    number = Column(Integer, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)


