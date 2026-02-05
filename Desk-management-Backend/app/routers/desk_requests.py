from datetime import date
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.desk_requests import DeskRequest
from app.models.desk_assignments import DeskAssignment
from app.models.desks import Desk
from app.models.employees import Employee
from app.models.departments import Department
from app.models.system_settings import SystemSettings
from app.utils.auth import require_role
from app.utils.desk_utils import find_available_desk_for_range


router = APIRouter(prefix="/desk-requests", tags=["Desk Requests"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DeskRequestCreate(BaseModel):
    shift: str  # MORNING / NIGHT
    from_date: date
    to_date: date
    note: str | None = None


@router.get("/")
def list_desk_requests(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    """
    List all desk requests for admins, optionally filtered by status.
    """
    query = db.query(DeskRequest, Employee, Department, Desk)
    query = (
        query.join(Employee, DeskRequest.employee_id == Employee.id)
        .join(Department, DeskRequest.department_id == Department.id)
        .outerjoin(Desk, DeskRequest.assigned_desk_id == Desk.id)
    )

    if status:
        query = query.filter(DeskRequest.status == status)

    rows = query.order_by(DeskRequest.created_at.desc()).all()

    results = []
    for req, emp, dept, desk in rows:
        results.append(
            {
                "id": req.id,
                "status": req.status,
                "shift": req.shift,
                "from_date": str(req.from_date),
                "to_date": str(req.to_date),
                "note": req.note,
                "employee_name": emp.name,
                "employee_code": emp.employee_code,
                "employee_id": emp.id,
                "department": dept.name,
                "department_id": dept.id,
                "assigned_desk_number": desk.desk_number if desk else None,
                "created_at": req.created_at.isoformat() if req.created_at else None,
            }
        )

    return results


@router.get("/me")
def list_my_desk_requests(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("EMPLOYEE")),
):
    """
    List desk requests for the currently logged-in employee.
    """
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for user",
        )

    query = (
        db.query(DeskRequest, Department, Desk)
        .join(Department, DeskRequest.department_id == Department.id)
        .outerjoin(Desk, DeskRequest.assigned_desk_id == Desk.id)
        .filter(DeskRequest.employee_id == employee.id)
        .order_by(DeskRequest.created_at.desc())
    )

    results = []
    for req, dept, desk in query.all():
        results.append(
            {
                "id": req.id,
                "status": req.status,
                "shift": req.shift,
                "from_date": str(req.from_date),
                "to_date": str(req.to_date),
                "note": req.note,
                "department": dept.name,
                "assigned_desk_number": desk.desk_number if desk else None,
                "created_at": req.created_at.isoformat() if req.created_at else None,
            }
        )

    return results


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_desk_request(
    payload: DeskRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("EMPLOYEE")),
):
    """
    Create a new desk request for the logged‑in employee.
    Department is derived from the employee profile.
    If auto‑assignment is enabled, this will also create a
    DeskAssignment when a suitable desk is found.
    """
    if payload.from_date > payload.to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be on or before to_date",
        )

    if payload.shift not in ("MORNING", "NIGHT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid shift. Use MORNING or NIGHT.",
        )

    # Find employee profile for this user
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for user",
        )

    # Map employee.department string to Department row
    department = (
        db.query(Department)
        .filter(Department.name == employee.department)
        .first()
    )
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department configuration not found for employee",
        )

    # Create the desk request record
    desk_request = DeskRequest(
        id=str(uuid.uuid4()),
        employee_id=employee.id,
        department_id=department.id,
        shift=payload.shift,
        from_date=payload.from_date,
        to_date=payload.to_date,
        note=payload.note,
        status="PENDING",
    )
    db.add(desk_request)
    db.flush()

    # Check global auto‑assignment setting
    settings = (
        db.query(SystemSettings)
        .filter(SystemSettings.id == "GLOBAL")
        .first()
    )
    auto_enabled = bool(settings and settings.auto_assignment_enabled)

    assigned_desk: Desk | None = None
    created_assignment: DeskAssignment | None = None

    if auto_enabled:
        # Candidate desks: same department and its configured floor,
        # and not INACTIVE (MAINTENANCE is allowed but usually avoided)
        candidate_desks = (
            db.query(Desk)
            .filter(Desk.department_id == department.id)
            .filter(Desk.floor_id == department.floor_id)
            .filter(Desk.current_status != "INACTIVE")
            .all()
        )

        if candidate_desks:
            assigned_desk = find_available_desk_for_range(
                db=db,
                candidate_desks=candidate_desks,
                shift=payload.shift,
                start=payload.from_date,
                end=payload.to_date,
            )

        if assigned_desk:
            # Create a time‑bound, shift‑aware assignment
            created_assignment = DeskAssignment(
                id=str(uuid.uuid4()),
                desk_id=assigned_desk.id,
                employee_id=employee.id,
                assigned_by=current_user.id,
                assigned_date=payload.from_date,
                # Keep released_date open so dashboards treat this as active;
                # the booking window is enforced via start_date/end_date + shift.
                released_date=None,
                assignment_type="TEMPORARY",
                shift=payload.shift,
                start_date=payload.from_date,
                end_date=payload.to_date,
                is_auto_assigned=True,
                notes=payload.note,
            )
            db.add(created_assignment)

            # Link request to desk and mark approved
            desk_request.assigned_desk_id = assigned_desk.id
            desk_request.status = "APPROVED"

            # Mark desk as ASSIGNED at a high level
            if assigned_desk.current_status != "ASSIGNED":
                assigned_desk.current_status = "ASSIGNED"

    db.commit()
    db.refresh(desk_request)

    response = {
        "id": desk_request.id,
        "status": desk_request.status,
        "shift": desk_request.shift,
        "from_date": str(desk_request.from_date),
        "to_date": str(desk_request.to_date),
        "note": desk_request.note,
        "auto_assignment_enabled": auto_enabled,
    }

    if assigned_desk:
        response["assigned_desk"] = {
            "desk_id": assigned_desk.id,
            "desk_number": assigned_desk.desk_number,
            "floor": assigned_desk.floor,
        }

    return response

