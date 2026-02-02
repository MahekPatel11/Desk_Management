from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid

from app.database.database import get_db
from app.models.users import User
from passlib.context import CryptContext


router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------
# Request Models
# -------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# -------------------------
# Utility Functions
# -------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# -------------------------
# Auth APIs
# -------------------------

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if user.role != request.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role mismatch"
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )

    # JWT logic can be plugged in later
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@router.post("/logout")
def logout():
    # Stateless logout (JWT-based systems handle this on frontend)
    return {"message": "Logged out successfully"}


# -------------------------
# Forgot Password (Tokenization)
# -------------------------

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    reset_token = str(uuid.uuid4())
    expiry_time = datetime.utcnow() + timedelta(minutes=15)

    user.reset_token = reset_token
    user.reset_token_expiry = expiry_time

    db.commit()

    # Token returned directly (mocked email)
    return {
        "message": "Reset token generated",
        "reset_token": reset_token,
        "expires_at": expiry_time
    }


# -------------------------
# Reset Password (Using Token)
# -------------------------

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    if not user.reset_token_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token expiry missing"
        )

    if user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token expired"
        )

    user.password_hash = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None

    db.commit()

    return {
        "message": "Password updated successfully"
    }
