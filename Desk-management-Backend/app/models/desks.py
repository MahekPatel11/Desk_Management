from sqlalchemy import Column, String, DateTime, Enum, Integer
from datetime import datetime

from app.database.database import Base


class Desk(Base):
    __tablename__ = "desks"

    id = Column(String(36), primary_key=True, index=True)
    desk_number = Column(String(50), unique=True, nullable=False)
    floor = Column(Integer, nullable=False)
    location = Column(String(255), nullable=True)
    current_status = Column(
        Enum(
            "AVAILABLE",
            "ASSIGNED",
            "MAINTENANCE",
            "INACTIVE",
            name="desk_status_enum"
        ),
        nullable=False,
        default="AVAILABLE"
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    @property
    def display_location(self):
        """Always return location in 'Floor X' format"""
        if self.location:
            return self.location
        # Return floor as numeric, formatted as display
        return f"Floor {self.floor}" if self.floor else "Unknown"
