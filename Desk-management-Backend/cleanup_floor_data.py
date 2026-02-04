"""
Script to clean up floor data in MySQL database.
Ensures all floor values are numeric (1, 2, 3) instead of strings like "Floor 1", "Floor 2".
"""

from app.database.database import SessionLocal
from app.models.desks import Desk
import re

def cleanup_floor_data():
    db = SessionLocal()
    try:
        desks = db.query(Desk).all()
        
        updated_count = 0
        for desk in desks:
            original_floor = desk.floor
            
            # If floor is a string, extract numeric value
            if isinstance(desk.floor, str):
                # Try to extract numeric value
                match = re.search(r'\d+', str(desk.floor))
                if match:
                    new_floor = int(match.group())
                    desk.floor = new_floor
                    print(f"Updated desk {desk.desk_number}: floor '{original_floor}' -> {new_floor}")
                    updated_count += 1
                else:
                    # If no number found, try to extract from desk_number
                    if desk.desk_number and len(desk.desk_number) >= 3:
                        floor_from_desk = int(desk.desk_number[0])
                        desk.floor = floor_from_desk
                        print(f"Updated desk {desk.desk_number}: floor '{original_floor}' -> {floor_from_desk} (from desk_number)")
                        updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"\n✓ Successfully updated {updated_count} desk(s) with numeric floor values")
        else:
            print("✓ All floor values are already numeric")
            
    except Exception as e:
        db.rollback()
        print(f"✗ Error during cleanup: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting floor data cleanup...")
    cleanup_floor_data()
    print("Cleanup complete!")
