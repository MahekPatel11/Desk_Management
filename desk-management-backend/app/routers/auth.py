from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database.database import SessionLocal
from app.models.users import User
from app.utils.jwt import create_access_token

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
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# -------------------------------------------------
# Request schema
# -------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str  # EMPLOYEE / ADMIN / HR / IT

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

    # 3️⃣ Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # 4️⃣ ROLE CROSS-VERIFICATION (NEW & REQUIRED)
    if user.role != request.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorized to login as {request.role}"
        )

    # 5️⃣ Create JWT token
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }

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

