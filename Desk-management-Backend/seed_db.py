import uuid
from datetime import date

from app.database.database import SessionLocal, engine, Base
from app.models.users import User
from app.models.employees import Employee
from app.models.desks import Desk
from app.models.floors import Floor
from app.models.departments import Department
from app.models.system_settings import SystemSettings
from app.utils.auth import pwd_context


def seed():
  """
  Drop existing tables, recreate schema, and seed with
  realistic users, departments, floors, and desks.
  """
  print("Dropping and recreating tables...")
  Base.metadata.drop_all(bind=engine)
  Base.metadata.create_all(bind=engine)

  db = SessionLocal()
  try:
    # ------------------------------------------------------------------
    # 1. Floors
    # ------------------------------------------------------------------
    print("Creating floors...")
    floor1 = Floor(
      id=str(uuid.uuid4()),
      name="Floor 1",
      number=1,
    )
    floor2 = Floor(
      id=str(uuid.uuid4()),
      name="Floor 2",
      number=2,
    )
    floor3 = Floor(
      id=str(uuid.uuid4()),
      name="Floor 3",
      number=3,
    )
    db.add_all([floor1, floor2, floor3])
    db.flush()

    # ------------------------------------------------------------------
    # 2. Departments mapped to floors
    # ------------------------------------------------------------------
    print("Creating departments...")
    sales = Department(
      id=str(uuid.uuid4()),
      name="Sales",
      floor_id=floor1.id,
    )
    development = Department(
      id=str(uuid.uuid4()),
      name="Development",
      floor_id=floor2.id,
    )
    hr = Department(
      id=str(uuid.uuid4()),
      name="HR",
      floor_id=floor2.id,
    )
    support = Department(
      id=str(uuid.uuid4()),
      name="Support",
      floor_id=floor1.id,
    )
    db.add_all([sales, development, hr, support])
    db.flush()

    departments_by_name = {
      "Sales": sales,
      "Development": development,
      "HR": hr,
      "Support": support,
    }

    # ------------------------------------------------------------------
    # 3. System settings (auto‑assignment ON by default)
    # ------------------------------------------------------------------
    print("Creating system settings...")
    settings = SystemSettings(
      id="GLOBAL",
      auto_assignment_enabled=True,
    )
    db.add(settings)

    # ------------------------------------------------------------------
    # 4. Desks per floor/department
    # ------------------------------------------------------------------
    print("Creating desks...")
    desks_data = [
      # Floor 1 - Sales
      ("101", floor1, sales, "AVAILABLE"),
      ("102", floor1, sales, "AVAILABLE"),
      ("103", floor1, sales, "AVAILABLE"),
      # Floor 1 - Support
      ("104", floor1, support, "AVAILABLE"),
      ("105", floor1, support, "AVAILABLE"),
      # Floor 2 - Development
      ("201", floor2, development, "AVAILABLE"),
      ("202", floor2, development, "AVAILABLE"),
      ("203", floor2, development, "AVAILABLE"),
      # Floor 2 - HR
      ("204", floor2, hr, "AVAILABLE"),
      ("205", floor2, hr, "AVAILABLE"),
      # Floor 3 - extra pool (no specific department)
      ("301", floor3, None, "AVAILABLE"),
      ("302", floor3, None, "AVAILABLE"),
    ]

    for num, floor_obj, dept_obj, status in desks_data:
      desk = Desk(
        id=str(uuid.uuid4()),
        desk_number=num,
        floor=floor_obj.number,
        floor_id=floor_obj.id,
        department_id=dept_obj.id if dept_obj else None,
        current_status=status,
      )
      db.add(desk)

    # ------------------------------------------------------------------
    # 5. Users and Employees (clear old users implicitly via drop_all)
    # ------------------------------------------------------------------
    print("Creating users and employees...")

    # Admins
    admins = [
      ("Emily Carter", "emily.carter@company.com"),
      ("Rajesh Mehta", "rajesh.mehta@company.com"),
      ("Sarah Williams", "sarah.williams@company.com"),
    ]
    for full_name, email in admins:
      user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=pwd_context.hash("admin@123"),
        full_name=full_name,
        role="ADMIN",
        is_active=True,
      )
      db.add(user)

    # IT Support
    it_support_users = [
      ("Daniel Moore", "daniel.moore@company.com"),
      ("Priya Sharma", "priya.sharma@company.com"),
      ("Michael Brown", "michael.brown@company.com"),
    ]
    for full_name, email in it_support_users:
      user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=pwd_context.hash("it@123"),
        full_name=full_name,
        role="IT_SUPPORT",
        is_active=True,
      )
      db.add(user)

    db.flush()

    # Employees
    employees_data = [
      ("John Anderson", "john.anderson@company.com", "Sales", "MORNING"),
      ("Neha Patel", "neha.patel@company.com", "Sales", "MORNING"),
      ("Rahul Verma", "rahul.verma@company.com", "Development", "NIGHT"),
      ("Aisha Khan", "aisha.khan@company.com", "Development", "MORNING"),
      ("Kunal Shah", "kunal.shah@company.com", "Development", "NIGHT"),
      ("Sofia Martinez", "sofia.martinez@company.com", "HR", "MORNING"),
      ("Arjun Reddy", "arjun.reddy@company.com", "HR", "MORNING"),
      ("Vikram Singh", "vikram.singh@company.com", "Support", "NIGHT"),
      ("Pooja Nair", "pooja.nair@company.com", "Support", "MORNING"),
      ("Lucas Johnson", "lucas.johnson@company.com", "Sales", "NIGHT"),
    ]

    for full_name, email, dept_name, shift in employees_data:
      user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=pwd_context.hash("employee@123"),
        full_name=full_name,
        role="EMPLOYEE",
        is_active=True,
      )
      db.add(user)
      db.flush()

      dept_obj = departments_by_name[dept_name]
      emp = Employee(
        id=str(uuid.uuid4()),
        employee_code=f"EMP-{str(uuid.uuid4())[:8]}",
        name=full_name,
        department=dept_name,
        user_id=user.id,
        shift=shift,
      )
      db.add(emp)

    db.commit()
    print("Database seeded successfully with new schema and data.")

  except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
  finally:
    db.close()


if __name__ == "__main__":
  seed()
