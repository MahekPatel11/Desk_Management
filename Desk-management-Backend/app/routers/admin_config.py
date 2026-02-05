import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.floors import Floor
from app.models.departments import Department
from app.models.desks import Desk
from app.utils.auth import require_role


router = APIRouter(prefix="/admin-config", tags=["Admin Config"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FloorCreate(BaseModel):
    name: str
    number: int
    department_name: str | None = None


class DepartmentCreate(BaseModel):
    name: str
    floor_id: str


class DeskCreate(BaseModel):
    desk_number: str
    floor_id: str
    department_id: str | None = None
    location: str | None = None


@router.get("/floors")
def list_floors(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    floors = db.query(Floor).all()
    departments = db.query(Department).all()
    
    result = []
    for floor in floors:
        floor_depts = [d.name for d in departments if d.floor_id == floor.id]
        # Show only the first department if multiple exist (aiming for 1:1)
        dept_str = f" ({floor_depts[0]})" if floor_depts else ""
        result.append({
            "id": floor.id,
            "name": f"Floor {floor.number}",
            "original_name": floor.name,
            "number": floor.number,
            "departments": [{"id": d.id, "name": d.name} for d in departments if d.floor_id == floor.id]
        })
    return result


@router.get("/departments")
def list_departments(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    return db.query(Department).all()


@router.post("/floors", status_code=status.HTTP_201_CREATED)
def create_floor(
    payload: FloorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    existing = (
        db.query(Floor)
        .filter(Floor.number == payload.number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Floor number already exists",
        )

    floor = Floor(
        id=str(uuid.uuid4()),
        name=payload.name,
        number=payload.number,
    )
    db.add(floor)

    try:
        db.commit()
        db.refresh(floor)
        return floor
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    floor = (
        db.query(Floor)
        .filter(Floor.id == payload.floor_id)
        .first()
    )
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found",
        )

    # Check if floor already has a department (Enforce 1:1)
    existing_on_floor = (
        db.query(Department)
        .filter(Department.floor_id == payload.floor_id)
        .first()
    )
    if existing_on_floor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Floor {floor.number} already has a department: {existing_on_floor.name}",
        )

    existing = (
        db.query(Department)
        .filter(Department.name == payload.name)
        .first()
    )
    if existing:
        # If the department exists, check if it's already on this floor
        if existing.floor_id == payload.floor_id:
            return existing
        
        # If it's on a different floor, we "move" it or re-associate it
        # Step 1: Check if the target floor ALREADY has a DIFFERENT department
        existing_on_floor = (
            db.query(Department)
            .filter(Department.floor_id == payload.floor_id)
            .filter(Department.id != existing.id)
            .first()
        )
        if existing_on_floor:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Floor {floor.number} already has a department: {existing_on_floor.name}. A floor can only have one department.",
            )
        
        # Step 2: Update the department's floor
        existing.floor_id = payload.floor_id
        dept = existing
    else:
        # Create new department
        dept = Department(
            id=str(uuid.uuid4()),
            name=payload.name,
            floor_id=floor.id,
        )
        db.add(dept)
    
    # Update all desks on this floor to this department
    db.query(Desk).filter(Desk.floor_id == floor.id).update({"department_id": dept.id})

    try:
        db.commit()
        db.refresh(dept)
        return dept
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )


@router.post("/desks", status_code=status.HTTP_201_CREATED)
def create_desk(
    payload: DeskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN")),
):
    floor = (
        db.query(Floor)
        .filter(Floor.id == payload.floor_id)
        .first()
    )
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found",
        )

    department = None
    if payload.department_id:
        department = (
            db.query(Department)
            .filter(Department.id == payload.department_id)
            .first()
        )
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    existing = (
        db.query(Desk)
        .filter(Desk.desk_number == payload.desk_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Desk number already exists",
        )

    desk = Desk(
        id=str(uuid.uuid4()),
        desk_number=payload.desk_number,
        floor=floor.number,
        floor_id=floor.id,
        department_id=department.id if department else None,
        location=payload.location,
        current_status="AVAILABLE",
    )
    db.add(desk)
    db.commit()
    db.refresh(desk)
    return desk

