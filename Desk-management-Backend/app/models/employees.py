from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from datetime import datetime

from app.database.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    shift = Column(
        Enum("MORNING", "NIGHT", name="employee_shift_enum"),
        nullable=True
    )
    created_at = Column(DateTime, default=datetime.utcnow)
