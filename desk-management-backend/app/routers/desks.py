from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
import uuid

from app.database.database import SessionLocal
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.employees import Employee
from app.utils.auth import require_role
from app.utils.desk_utils import extract_floor_and_index
from app.models.desk_status_history import DeskStatusHistory

# -------------------------------------------------
# Router setup
# -------------------------------------------------
router = APIRouter(
    prefix="/desks",
    tags=["Desks"]
)

# -------------------------------------------------http://127.0.0.1:8000 
# Database dependency
# -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# Request Schemas
# -------------------------------------------------
class AssignDeskRequest(BaseModel):
    desk_id: str
    employee_id: str
    assignment_type: str  # PERMANENT / TEMPORARY


class UpdateDeskStatusRequest(BaseModel):
    current_status: str  # AVAILABLE / MAINTENANCE / INACTIVE

# -------------------------------------------------
# GET /desks -> List desks (filters + pagination)
# -------------------------------------------------
@router.get("/")
def list_desks(
    status: str | None = Query(None, description="Filter by desk status"),
    floor: int | None = Query(None, description="Filter by floor number"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(Desk)

    if status:
        query = query.filter(Desk.current_status == status)

    if floor:
        query = query.filter(Desk.floor == floor)

    total = query.count()

    desks = (
        query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "data": desks
    }

# -------------------------------------------------
# GET /desks/{desk_id} -> Desk details by UUID
# -------------------------------------------------
@router.get("/{desk_id}")
def get_desk_by_id(
    desk_id: str,
    db: Session = Depends(get_db)
):
    desk = db.query(Desk).filter(Desk.id == desk_id).first()

    if not desk:
        return {"error": "Desk not found"}

    return {
        "id": desk.id,
        "desk_number": desk.desk_number,
        "floor": desk.floor,
        "current_status": desk.current_status
    }

# -------------------------------------------------
# POST /desks/assign-desk -> Assign desk (ADMIN only)
# -------------------------------------------------
@router.post("/assign-desk")
def assign_desk(
    request: AssignDeskRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    # Check desk exists
    desk = db.query(Desk).filter(Desk.id == request.desk_id).first()
    if not desk:
        return {"error": "Desk not found"}

    # Desk must be AVAILABLE
    if desk.current_status != "AVAILABLE":
        return {"error": "Desk is not available"}

    # Check employee exists
    employee = (
        db.query(Employee)
        .filter(Employee.id == request.employee_id)
        .first()
    )
    if not employee:
        return {"error": "Employee not found"}

    # Create assignment
    assignment = DeskAssignment(
        id=str(uuid.uuid4()),
        desk_id=desk.id,
        employee_id=employee.id,
        assigned_by=current_user.id,
        assigned_date=date.today(),
        assignment_type=request.assignment_type
    )

    # Update desk status
    # Track old status
    old_status = desk.current_status

    # Update desk status
    desk.current_status = "ASSIGNED"

    # Insert desk status history
    history = DeskStatusHistory(
        id=str(uuid.uuid4()),
        desk_id=desk.id,
        old_status=old_status,
        new_status=request.current_status,
        changed_by=current_user.id,
        reason=request.reason or "Status updated by admin",
        notes=request.notes,
        expected_resolution_date=None,
        changed_at=date.today()
    )

 

    db.add(history)


    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Desk assigned successfully",
        "desk_number": desk.desk_number,
        "employee_id": employee.id,
        "assigned_by": current_user.full_name
    }

# -------------------------------------------------
# PUT /desks/by-number/{desk_number}
# Update desk status using numeric desk number (ADMIN only)
# -------------------------------------------------
@router.put("/by-number/{desk_number}")
def update_desk_status_by_number(
    desk_number: int,
    request: UpdateDeskStatusRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    # Validate desk number format & extract floor
    try:
        floor, desk_index = extract_floor_and_index(desk_number)
    except ValueError as e:
        return {"error": str(e)}

    desk = (
        db.query(Desk)
        .filter(Desk.desk_number == desk_number)
        .first()
    )

    if not desk:
        return {"error": "Desk not found"}

    # Business rule: cannot modify ASSIGNED desk
    if desk.current_status == "ASSIGNED":
        return {"error": "Cannot change status of an assigned desk"}

    # Track old status
    old_status = desk.current_status

    # Update desk status
    desk.current_status = request.current_status
    desk.floor = floor

    # Insert desk status history
    history = DeskStatusHistory(
         id=str(uuid.uuid4()),
         desk_id=desk.id,
         old_status=old_status,
         new_status=request.current_status,
         changed_by=current_user.id,
         changed_at=date.today()
    )

    db.add(history)


    db.commit()
    db.refresh(desk)

    return {
        "message": "Desk status updated successfully",
        "desk_number": desk.desk_number,
        "floor": desk.floor,
        "new_status": desk.current_status
    }
