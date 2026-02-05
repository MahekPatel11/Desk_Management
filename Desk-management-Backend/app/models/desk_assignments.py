from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    Boolean,
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

    # Time‑bound, shift‑aware booking fields
    shift = Column(
        Enum("MORNING", "NIGHT", name="assignment_shift_enum"),
        nullable=False,
    )

    # Explicit date range for booking
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Flag to indicate if this assignment was created by auto‑assignment
    is_auto_assigned = Column(Boolean, default=False, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
