from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime

from app.database.database import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    # Single-row table keyed by a fixed id (e.g. "GLOBAL")
    id = Column(String(36), primary_key=True, index=True)
    auto_assignment_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

