from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Text,
)
from datetime import datetime

from app.database.database import Base


class DeskRequest(Base):
    __tablename__ = "desk_requests"

    id = Column(String(36), primary_key=True, index=True)

    employee_id = Column(
        String(36),
        ForeignKey("employees.id"),
        nullable=False,
    )

    department_id = Column(
        String(36),
        ForeignKey("departments.id"),
        nullable=False,
    )

    shift = Column(
        Enum("MORNING", "NIGHT", name="request_shift_enum"),
        nullable=False,
    )

    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)

    note = Column(Text, nullable=True)

    status = Column(
        Enum(
            "PENDING",
            "APPROVED",
            "REJECTED",
            name="request_status_enum",
        ),
        nullable=False,
        default="PENDING",
    )

    assigned_desk_id = Column(
        String(36),
        ForeignKey("desks.id"),
        nullable=True,
    )

    created_at = Column(DateTime, default=datetime.utcnow)

