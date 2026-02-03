import uuid
from datetime import date
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.models.users import User
from app.models.employees import Employee
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.desk_status_history import DeskStatusHistory
from app.utils.auth import pwd_context

def seed():
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Create Users
        print("Creating users...")
        
        # Admin Users
        admins_data = [
            ("sarah@company.com", "Sarah Johnson"),
            ("robert@company.com", "Robert Chen"),
            ("emily@company.com", "Emily Davis"),
        ]
        
        for email, name in admins_data:
            admin = db.query(User).filter(User.email == email).first()
            if not admin:
                admin = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    password_hash=pwd_context.hash("admin123"),
                    full_name=name,
                    role="ADMIN",
                    is_active=True
                )
                db.add(admin)
        
        # Employees
        employees_data = [
            ("john@company.com", "John Doe", "EMP-2156", "Engineering"),
            ("emma@company.com", "Emma Wilson", "EMP-2234", "Marketing"),
            ("david@company.com", "David Smith", "EMP-1998", "Sales"),
            ("lisa@company.com", "Lisa Anderson", "EMP-2301", "HR"),
            ("michael@company.com", "Michael Brown", "EMP-2445", "Engineering"),
            ("sophia@company.com", "Sophia Garcia", "EMP-2512", "Product"),
            ("james@company.com", "James Miller", "EMP-2678", "Finance"),
            ("olivia@company.com", "Olivia Taylor", "EMP-2734", "Operations"),
            ("william@company.com", "William Moore", "EMP-2891", "Legal"),
            ("isabella@company.com", "Isabella White", "EMP-2956", "Customer Support"),
        ]
        
        for email, name, code, dept in employees_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    password_hash=pwd_context.hash("password"),
                    full_name=name,
                    role="EMPLOYEE",
                    is_active=True
                )
                db.add(user)
                db.flush() # flush to get ID
            
            # Create Employee Record
            emp = db.query(Employee).filter(Employee.employee_code == code).first()
            if not emp:
                emp = Employee(
                    id=str(uuid.uuid4()),
                    employee_code=code,
                    name=name,
                    department=dept,
                    user_id=user.id
                )
                db.add(emp)

        # 3. IT Support Users
        print("Creating IT Support users...")
        it_support_data = [
            ("alex@company.com", "Alex Rivera"),
            ("kevin@company.com", "Kevin Zhang"),
            ("maria@company.com", "Maria Lopez"),
        ]
        
        for email, name in it_support_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    password_hash=pwd_context.hash("it123"),
                    full_name=name,
                    role="IT_SUPPORT",
                    is_active=True
                )
                db.add(user)


        # 2. Create Desks
        print("Creating desks...")
        desks_data = [
            ("101", "Floor 1", "AVAILABLE"),
            ("102", "Floor 1", "AVAILABLE"),
            ("103", "Floor 1", "AVAILABLE"),
            ("104", "Floor 1", "AVAILABLE"),
            ("105", "Floor 1", "AVAILABLE"),
            ("201", "Floor 2", "AVAILABLE"),
            ("202", "Floor 2", "AVAILABLE"),
            ("203", "Floor 2", "AVAILABLE"),
            ("204", "Floor 2", "AVAILABLE"),
            ("205", "Floor 2", "ASSIGNED"),
            ("206", "Floor 2", "AVAILABLE"),
            ("301", "Floor 3", "ASSIGNED"),
            ("302", "Floor 3", "AVAILABLE"),
            ("303", "Floor 3", "AVAILABLE"),
            ("304", "Floor 3", "AVAILABLE"),
            ("305", "Floor 3", "AVAILABLE"),
        ]

        for num, floor, status in desks_data:
            desk = db.query(Desk).filter(Desk.desk_number == num).first()
            if not desk:
                desk = Desk(
                    id=str(uuid.uuid4()),
                    desk_number=num,
                    floor=floor,
                    current_status=status
                )
                db.add(desk)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
