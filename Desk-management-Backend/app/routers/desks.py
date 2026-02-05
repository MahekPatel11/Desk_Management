from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime
import uuid
import logging

logger = logging.getLogger(__name__)

from app.database.database import SessionLocal
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.employees import Employee
from app.models.users import User
from app.utils.auth import require_role
from app.utils.desk_utils import extract_floor_and_index
from app.models.desk_status_history import DeskStatusHistory
from app.models.departments import Department
from app.models.desk_requests import DeskRequest

# -------------------------------------------------
# Router setup
# -------------------------------------------------
router = APIRouter(
    prefix="/desks",
    tags=["Desks"]
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
# Request Schemas
# -------------------------------------------------
class AssignDeskRequest(BaseModel):
    desk_id: str
    employee_id: str
    assignment_type: str
    notes: str | None = None
    date: str | None = None
    end_date: str | None = None
    desk_request_id: str | None = None
    shift: str | None = "MORNING"
    is_reassignment: bool | None = False

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
    # Join departments so we can expose department info alongside desks
    query = (
        db.query(Desk, Department.name.label("department_name"))
        .outerjoin(Department, Desk.department_id == Department.id)
    )

    if status:
        query = query.filter(Desk.current_status == status)

    if floor:
        query = query.filter(Desk.floor == floor)

    total = query.count()

    rows = (
        query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # Serialize explicitly so we can include department_name while preserving
    # the existing fields used by the frontend.
    data = []
    for desk, dept_name in rows:
        data.append({
            "id": desk.id,
            "desk_number": desk.desk_number,
            "floor": desk.floor,
            "location": desk.location,
            "floor_id": desk.floor_id,
            "department_id": desk.department_id,
            "department_name": dept_name,
            "current_status": desk.current_status,
            "created_at": desk.created_at.isoformat() if desk.created_at else None,
            "updated_at": desk.updated_at.isoformat() if desk.updated_at else None,
        })

    return {
        "total": total,
        "page": page,
        "size": size,
        "data": data,
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
# POST /desks/assign-desk
# -------------------------------------------------
@router.post("/assign-desk")
def assign_desk(
    request: AssignDeskRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["ADMIN", "IT_SUPPORT"]))
):
    print(f"DEBUG: Assigning desk {request.desk_id} to employee {request.employee_id}. is_reassignment={request.is_reassignment}")
    # Check desk exists
    desk = db.query(Desk).filter(Desk.id == request.desk_id).first()
    if not desk:
        print(f"DEBUG: Desk {request.desk_id} not found")
        raise HTTPException(status_code=404, detail="Desk not found")

    # Desk must not be in MAINTENANCE or INACTIVE
    if desk.current_status in ["MAINTENANCE", "INACTIVE"]:
        print(f"DEBUG: Desk {desk.desk_number} is in {desk.current_status} status")
        raise HTTPException(status_code=400, detail=f"Desk is in {desk.current_status} status and cannot be assigned")

    # Check employee exists
    employee = (
        db.query(Employee)
        .filter(Employee.id == request.employee_id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Determine assignment date and range
    assignment_date = date.today()
    if request.date:
        try:
             assignment_date = date.fromisoformat(request.date)
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    start_date_obj = assignment_date
    end_date_obj = assignment_date 
    
    if request.end_date:
        try:
            end_date_obj = date.fromisoformat(request.end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
            
    if end_date_obj < start_date_obj:
         raise HTTPException(status_code=400, detail="End date cannot be before start date")

    # Check for ALL overlapping active assignments for the same desk and shift
    overlapping_assignments = (
        db.query(DeskAssignment)
        .filter(DeskAssignment.desk_id == desk.id)
        .filter(DeskAssignment.released_date == None)
        .filter(DeskAssignment.start_date <= end_date_obj)
        .filter(DeskAssignment.end_date >= start_date_obj)
        .filter(DeskAssignment.shift == (request.shift.upper() if request.shift else "MORNING"))
        .all()
    )

    if overlapping_assignments:
        if not request.is_reassignment:
            clashing_names = []
            for oa in overlapping_assignments:
                emp = db.query(Employee).filter(Employee.id == oa.employee_id).first()
                if emp:
                    clashing_names.append(f"{emp.name} ({oa.shift} shift, {oa.start_date} to {oa.end_date})")
            
            detail_msg = "Desk is already assigned to: " + ", ".join(clashing_names)
            print(f"DEBUG: Clash detected. {detail_msg}")
            raise HTTPException(status_code=400, detail=detail_msg)
        else:
            # Release ALL overlapping assignments
            for oa in overlapping_assignments:
                print(f"DEBUG: Releasing overlapping assignment {oa.id} for seamless reassignment")
                oa.released_date = date.today()
            # If the reassignment is for a future date, we should probably ensure 
            # the person's end_date is adjusted, but for now, releasing it (ending it today)
            # satisfies the clash-free check for create.

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

    # Create assignment
    assignment = DeskAssignment(
        id=str(uuid.uuid4()),
        desk_id=desk.id,
        employee_id=employee.id,
        assigned_by=current_user.id,
        assigned_date=date.today(),
        assignment_type=request.assignment_type,
        shift=request.shift.upper() if request.shift else "MORNING",
        start_date=start_date_obj,
        end_date=end_date_obj,
        is_auto_assigned=False,
        notes=request.notes
    )

    # If this assignment is linked to a request, update that request
    if request.desk_request_id:
        linked_request = (
            db.query(DeskRequest)
            .filter(DeskRequest.id == request.desk_request_id)
            .first()
        )
        if linked_request:
            linked_request.status = "APPROVED"
            linked_request.assigned_desk_id = desk.id

    # Update desk status
    old_status = desk.current_status
    desk.current_status = "ASSIGNED"

    # Insert desk status history
    history = DeskStatusHistory(
        id=str(uuid.uuid4()),
        desk_id=desk.id,
        old_status=old_status,
        new_status="ASSIGNED",
        changed_by=current_user.id,
        reason=f"Assigned to {employee.name} ({employee.employee_code})",
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
    current_user=Depends(require_role(["ADMIN", "IT_SUPPORT"]))
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
    desk_number: str,
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
        text = entry.reason
        # (Optional) Enhance text logic if needed, but 'reason' should already 
        # contain the rich info we added in assign_desk
        formatted_history.append({
            "date": entry.changed_at.strftime("%b %d, %Y - %I:%M %p"),
            "text": text,
            "status": entry.new_status,
            "user": user_name,
            "notes": entry.notes
        })

    return formatted_history
