from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.desk_assignments import DeskAssignment
from app.models.desks import Desk
from app.models.employees import Employee
from app.models.users import User

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_assignments(
    employee_code: str | None = Query(None, description="Filter by employee code"),
    desk_number: str | None = Query(None, description="Filter by desk number"),
    assigned_by: str | None = Query(None, description="Filter by admin name"),
    from_date: str | None = Query(None, description="Start date YYYY-MM-DD"),
    to_date: str | None = Query(None, description="End date YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            DeskAssignment.id,
            Desk.desk_number,
            Employee.employee_code,
            User.full_name.label("assigned_by"),
            DeskAssignment.assigned_date,
            DeskAssignment.assignment_type,
            Desk.current_status
        )
        .join(Desk, DeskAssignment.desk_id == Desk.id)
        .join(Employee, DeskAssignment.employee_id == Employee.id)
        .join(User, DeskAssignment.assigned_by == User.id)
    )

    # ---------------- FILTERS ----------------

    if employee_code:
        query = query.filter(Employee.employee_code == employee_code)

    if desk_number:
        query = query.filter(Desk.desk_number == desk_number)

    if assigned_by:
        query = query.filter(User.full_name.ilike(f"%{assigned_by}%"))

    if from_date:
        query = query.filter(DeskAssignment.assigned_date >= from_date)

    if to_date:
        query = query.filter(DeskAssignment.assigned_date <= to_date)

    # ---------------- PAGINATION ----------------

    total = query.count()

    data = (
        query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "data": data
    }

