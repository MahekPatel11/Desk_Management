from app.database.database import SessionLocal
from app.models.desk_assignments import DeskAssignment
from app.models.employees import Employee
from app.models.desks import Desk
from datetime import date

db = SessionLocal()

def cleanup():
    # 1. Ensure each employee has at most one active assignment
    employees = db.query(Employee).all()
    for emp in employees:
        active_assignments = (
            db.query(DeskAssignment)
            .filter(DeskAssignment.employee_id == emp.id)
            .filter(DeskAssignment.released_date == None)
            .order_by(DeskAssignment.assigned_date.desc(), DeskAssignment.created_at.desc())
            .all()
        )
        if len(active_assignments) > 1:
            print(f"Cleaning up {len(active_assignments)} assignments for employee {emp.name}...")
            for a in active_assignments[1:]:
                a.released_date = date.today()
            print(f"Released {len(active_assignments)-1} assignments for employee {emp.name}.")

    # 2. Ensure each desk has at most one active assignment
    desks = db.query(Desk).all()
    for d in desks:
        active_assignments = (
            db.query(DeskAssignment)
            .filter(DeskAssignment.desk_id == d.id)
            .filter(DeskAssignment.released_date == None)
            .order_by(DeskAssignment.assigned_date.desc(), DeskAssignment.created_at.desc())
            .all()
        )
        if len(active_assignments) > 1:
            print(f"Cleaning up {len(active_assignments)} assignments for desk {d.desk_number}...")
            # Keep the newest one
            for a in active_assignments[1:]:
                a.released_date = date.today()
            print(f"Released {len(active_assignments)-1} assignments for desk {d.desk_number}.")

    # 3. Final synchronization: ensure desk status matches assignments
    for d in desks:
        active_assignment = (
            db.query(DeskAssignment)
            .filter(DeskAssignment.desk_id == d.id)
            .filter(DeskAssignment.released_date == None)
            .first()
        )
        if active_assignment and d.current_status != "ASSIGNED":
            d.current_status = "ASSIGNED"
        elif not active_assignment and d.current_status == "ASSIGNED":
            d.current_status = "AVAILABLE"

    db.commit()
    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup()
db.close()
