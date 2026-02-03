from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.employees import Employee

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()
