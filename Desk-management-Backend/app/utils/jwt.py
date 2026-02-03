from datetime import datetime, timedelta
from jose import JWTError, jwt

# 🔑 Secret & config
SECRET_KEY = "desk-management-secret-key"  # TODO: move to env later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Short‑lived expiry for password reset tokens
RESET_TOKEN_EXPIRE_MINUTES = 15


def _encode_token(data: dict, expires_delta: timedelta) -> str:
    """
    Internal helper to encode a JWT with a specific expiry.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict) -> str:
    """
    Standard access token for authenticated sessions.
    """
    return _encode_token(
        data=data,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def create_password_reset_token(user_id: str) -> str:
    """
    Create a short‑lived JWT specifically for password reset.
    """
    payload = {
        "sub": user_id,
        "type": "password_reset",
    }
    return _encode_token(
        data=payload,
        expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    )


def decode_password_reset_token(token: str):
    """
    Decode and validate a password reset token.
    Returns payload dict on success, or None on invalid/expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except JWTError:
        return None
