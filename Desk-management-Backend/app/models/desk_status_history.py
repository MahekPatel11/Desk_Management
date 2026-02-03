from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Text
)
from datetime import datetime

from app.database.database import Base


class DeskStatusHistory(Base):
    __tablename__ = "desk_status_history"

    id = Column(String(36), primary_key=True, index=True)

    desk_id = Column(
        String(36),
        ForeignKey("desks.id"),
        nullable=False
    )

    old_status = Column(
        Enum(
            "AVAILABLE",
            "ASSIGNED",
            "MAINTENANCE",
            "INACTIVE",
            name="desk_status_history_old_enum"
        ),
        nullable=False
    )

    new_status = Column(
        Enum(
            "AVAILABLE",
            "ASSIGNED",
            "MAINTENANCE",
            "INACTIVE",
            name="desk_status_history_new_enum"
        ),
        nullable=False
    )

    changed_by = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False
    )

    reason = Column(String(255), nullable=False)

    notes = Column(Text, nullable=True)

    expected_resolution_date = Column(Date, nullable=True)

    changed_at = Column(DateTime, default=datetime.utcnow)
