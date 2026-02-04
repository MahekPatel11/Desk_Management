from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime
import uuid

from app.database.database import SessionLocal
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.employees import Employee
from app.models.users import User
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
    assignment_type: str
    notes: str | None = None
    date: str | None = None

class UpdateDeskStatusRequest(BaseModel):
    current_status: str
    reason: str | None = None
    notes: str | None = None
    expected_resolution_date: str | None = None

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

# ...

@router.post("/assign-desk")
def assign_desk(
    request: AssignDeskRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["ADMIN", "IT_SUPPORT"]))
):
    # Check desk exists
    desk = db.query(Desk).filter(Desk.id == request.desk_id).first()
    if not desk:
        raise HTTPException(status_code=404, detail="Desk not found")

    # Desk must not be in MAINTENANCE or INACTIVE
    if desk.current_status in ["MAINTENANCE", "INACTIVE"]:
        raise HTTPException(status_code=400, detail=f"Desk is in {desk.current_status} status and cannot be assigned")

    # Check employee exists
    employee = (
        db.query(Employee)
        .filter(Employee.id == request.employee_id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # If desk is ASSIGNED, release the current assignment(s)
    if desk.current_status == "ASSIGNED":
        active_desk_assignments = (
            db.query(DeskAssignment)
            .filter(DeskAssignment.desk_id == desk.id)
            .filter(DeskAssignment.released_date == None)
            .all()
        )
        for ad in active_desk_assignments:
            ad.released_date = date.today()
    
    # Check if this employee already has any active assignments elsewhere and release them
    existing_assignments = (
        db.query(DeskAssignment)
        .filter(DeskAssignment.employee_id == request.employee_id)
        .filter(DeskAssignment.released_date == None)
        .all()
    )
    for ea in existing_assignments:
        # Release the old assignment
        ea.released_date = date.today()
        # Set the old desk to AVAILABLE if it's currently ASSIGNED
        old_desk = db.query(Desk).filter(Desk.id == ea.desk_id).first()
        if old_desk and old_desk.current_status == "ASSIGNED":
            old_desk.current_status = "AVAILABLE"

    # Determine assignment date
    assignment_date = date.today()
    if request.date:
        try:
             assignment_date = date.fromisoformat(request.date)
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Create assignment
    assignment = DeskAssignment(
        id=str(uuid.uuid4()),
        desk_id=desk.id,
        employee_id=employee.id,
        assigned_by=current_user.id,
        assigned_date=assignment_date,
        assignment_type=request.assignment_type,
        notes=request.notes
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
        new_status="ASSIGNED",
        changed_by=current_user.id,
        reason="Assigned to employee",
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
    current_user=Depends(require_role(["ADMIN", "IT_SUPPORT"])) # Corrected role name
):
    # Validate desk number format & extract floor
    try:
        floor, desk_index = extract_floor_and_index(desk_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    desk = (
        db.query(Desk)
        .filter(Desk.desk_number == desk_number)
        .first()
    )

    if not desk:
        raise HTTPException(status_code=404, detail="Desk not found")

    # Business rule: IT Support can update status of any desk, but be careful with ASSIGNED
    # If the user wants to allow updating assigned desks, we remove the block
    # For now, let's keep it but maybe IT Support needs to put an assigned desk into maintenance
    # if it's broken. We will allow IT_SUPPORT to bypass if they provide a reason.
    # if desk.current_status == "ASSIGNED" and current_user.role != "IT_SUPPORT":
    #    raise HTTPException(status_code=400, detail="Cannot change status of an assigned desk")

    # Track old status
    old_status = desk.current_status

    # Update desk status
    desk.current_status = request.current_status
    # Use the floor string from the utility or keep existing if it matches
    desk.floor = floor

    # Convert expected_resolution_date string to date object if provided
    expected_res_date = None
    if request.expected_resolution_date:
        try:
            expected_res_date = date.fromisoformat(request.expected_resolution_date)
        except ValueError:
            # Fallback or keep as None if format is bad
            pass

    # Insert desk status history
    history = DeskStatusHistory(
         id=str(uuid.uuid4()),
         desk_id=desk.id,
         old_status=old_status,
         new_status=request.current_status,
         changed_by=current_user.id,
         reason=request.reason or "Manual status update",
         notes=request.notes,
         expected_resolution_date=expected_res_date,
         changed_at=datetime.utcnow()
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

# -------------------------------------------------
# GET /desks/by-number/{desk_number}/history
# -------------------------------------------------
@router.get("/by-number/{desk_number}/history")
def get_desk_history_by_number(
    desk_number: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["ADMIN", "IT_SUPPORT", "EMPLOYEE"]))
):
    desk = db.query(Desk).filter(Desk.desk_number == desk_number).first()
    if not desk:
        raise HTTPException(status_code=404, detail="Desk not found")

    # Fetch status history joined with User for the admin/specialist name
    history_entries = (
        db.query(
            DeskStatusHistory,
            User.full_name.label("user_name")
        )
        .join(User, DeskStatusHistory.changed_by == User.id)
        .filter(DeskStatusHistory.desk_id == desk.id)
        .order_by(DeskStatusHistory.changed_at.desc())
        .all()
    )

    # Format history for frontend
    formatted_history = []
    for entry, user_name in history_entries:
        # Check if this was an assignment to include employee name if possible
        text = entry.reason
        if entry.new_status == "ASSIGNED":
            # Try to find the assignment record created around the same time
            # For simplicity, we can just say "by Admin Name"
            text = f"Status changed to {entry.new_status} by {user_name}. Reason: {entry.reason}"
        else:
            text = f"Status changed to {entry.new_status} by {user_name}. Reason: {entry.reason}"

        formatted_history.append({
            "date": entry.changed_at.strftime("%b %d, %Y - %I:%M %p"),
            "text": text,
            "status": entry.new_status,
            "user": user_name,
            "notes": entry.notes
        })

    return formatted_history
