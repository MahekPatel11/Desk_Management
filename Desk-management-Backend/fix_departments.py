import uuid
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.floors import Floor
from app.models.departments import Department
from app.models.desks import Desk

def fix_data():
    db = SessionLocal()
    try:
        print("Checking for floor collisions...")
        # Get all departments grouped by floor
        floors = db.query(Floor).all()
        
        for floor in floors:
            depts = db.query(Department).filter(Department.floor_id == floor.id).all()
            if len(depts) > 1:
                print(f"Floor {floor.number} ({floor.name}) has {len(depts)} departments: {[d.name for d in depts]}")
                
                # Keep the first one, move the rest
                depts_to_move = depts[1:]
                
                for dept in depts_to_move:
                    print(f"Moving {dept.name} from Floor {floor.number}...")
                    
                    # ALWAYS create a new floor to avoid collision with existing "pool" floors/desks
                    all_floors = db.query(Floor).all()
                    max_num = 0
                    for f in all_floors:
                        if f.number > max_num:
                            max_num = f.number
                    
                    new_num = max_num + 1
                    print(f"Creating new Floor {new_num}...")
                    target_floor = Floor(
                        id=str(uuid.uuid4()),
                        name=f"Floor {new_num}",
                        number=new_num
                    )
                    db.add(target_floor)
                    db.commit()
                    db.refresh(target_floor)
                    
                    print(f"Assigning {dept.name} to {target_floor.name}")
                    
                    # Update Department
                    dept.floor_id = target_floor.id
                    db.add(dept)
                    db.commit()
                    
                    # Update Desks
                    print(f"Renumbering desks for {dept.name} on Floor {target_floor.number}...")
                    desks = db.query(Desk).filter(Desk.department_id == dept.id).all()
                    
                    for i, desk in enumerate(desks, 1):
                        desk.floor_id = target_floor.id
                        desk.floor = target_floor.number
                        
                        # Calculate new desk number
                        # Ensure uniqueness by checking DB loop? 
                        # Since we created a NEW floor {new_num}, desks {new_num}01 should not exist.
                        # BUT, just in case 401 exists on some other random floor mapping (unlikely), let's rely on the floor number logic.
                        
                        existing_collision = True
                        suffix = i
                        while existing_collision:
                            new_desk_num_str = f"{target_floor.number}{suffix:02d}"
                            new_desk_num = int(new_desk_num_str)
                            
                            # Check if this number exists anywhere
                            conflict = db.query(Desk).filter(Desk.desk_number == new_desk_num).first()
                            if not conflict:
                                desk.desk_number = new_desk_num
                                existing_collision = False
                            else:
                                suffix += 1
                        
                        db.add(desk)
                    
                    db.commit()
                    
        print("Data fixed successfully.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()
