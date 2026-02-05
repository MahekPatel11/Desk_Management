from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.system_settings import SystemSettings
from app.utils.auth import require_role


router = APIRouter(prefix="/settings", tags=["Settings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AutoAssignmentUpdate(BaseModel):
    enabled: bool


@router.get("/auto-assignment")
def get_auto_assignment(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    """
    Return whether auto‑assignment is currently enabled.
    """
    settings = (
        db.query(SystemSettings)
        .filter(SystemSettings.id == "GLOBAL")
        .first()
    )
    if not settings:
        # If settings row does not exist yet, treat as disabled
        return {"enabled": False}

    return {"enabled": bool(settings.auto_assignment_enabled)}


@router.put(
    "/auto-assignment",
    status_code=status.HTTP_204_NO_CONTENT,
)
def update_auto_assignment(
    payload: AutoAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    """
    Enable or disable desk auto‑assignment globally.
    """
    settings = (
        db.query(SystemSettings)
        .filter(SystemSettings.id == "GLOBAL")
        .first()
    )

    if not settings:
        settings = SystemSettings(
            id="GLOBAL",
            auto_assignment_enabled=payload.enabled,
        )
        db.add(settings)
    else:
        settings.auto_assignment_enabled = payload.enabled

    db.commit()

