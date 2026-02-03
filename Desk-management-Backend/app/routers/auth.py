from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from app.database.database import SessionLocal
from app.models.users import User
from app.utils.jwt import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)

# -------------------------------------------------
# Router setup
# -------------------------------------------------
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# -------------------------------------------------
# Database dependency
# -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# Password hashing setup
# -------------------------------------------------
from app.utils.auth import pwd_context


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# -------------------------------------------------
# Request schemas
# -------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str  # EMPLOYEE / ADMIN / IT_SUPPORT


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(request.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        password_hash=hashed_password,
        full_name=request.full_name,
        role=request.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}


# -------------------------------------------------
# POST /auth/login
# -------------------------------------------------
@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    # 1️⃣ Fetch user by email
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    # 2️⃣ Validate email & password
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 3️⃣ Validate Role
    if user.role != request.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role"
        )

    # 4️⃣ Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # 4️⃣ Create JWT token with user's actual role from database
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "role": user.role,
            "full_name": user.full_name
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role  # Return actual role from database
    }


# -------------------------------------------------
# POST /auth/forgot-password
# -------------------------------------------------
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a short‑lived JWT reset token for the given user.

    No email is sent – the token is returned in the response
    so the frontend can use it directly in the reset flow.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Explicit 404 so caller can handle "user not found"
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    reset_token = create_password_reset_token(user_id=user.id)

    return {
        "reset_token": reset_token,
        "token_type": "password_reset",
    }


# -------------------------------------------------
# POST /auth/reset-password
# -------------------------------------------------
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using a JWT reset token.
    """
    payload = decode_password_reset_token(request.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token payload",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    user.password_hash = hash_password(request.new_password)
    db.add(user)
    db.commit()

    return {"message": "Password reset successful"}


# -------------------------------------------------
# POST /auth/logout
# -------------------------------------------------
@router.post("/logout")
def logout():
    """
    Stateless logout.
    With JWT, logout is handled by the client
    by discarding the token.
    """
    return {
        "message": "Logged out successfully"
    }

