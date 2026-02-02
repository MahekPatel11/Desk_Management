from sqlalchemy import Column, String, Boolean, DateTime, Enum
from datetime import datetime

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)

    role = Column(
        Enum("ADMIN", "EMPLOYEE", "IT_SUPPORT", name="user_roles"),
        nullable=False
    )

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ADD THESE INSIDE THE CLASS
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
