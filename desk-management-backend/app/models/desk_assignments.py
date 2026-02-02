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


class DeskAssignment(Base):
    __tablename__ = "desk_assignments"

    id = Column(String(36), primary_key=True, index=True)

    desk_id = Column(
        String(36),
        ForeignKey("desks.id"),
        nullable=False
    )

    employee_id = Column(
        String(36),
        ForeignKey("employees.id"),
        nullable=False
    )

    assigned_by = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_date = Column(Date, nullable=False)

    released_date = Column(Date, nullable=True)

    assignment_type = Column(
        Enum("PERMANENT", "TEMPORARY", name="assignment_type_enum"),
        nullable=False
    )

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
