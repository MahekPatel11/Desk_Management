"""
Script to remove 4-digit desk numbers and keep only 3-digit ones.
Also handles any assignments related to removed desks.
"""

from app.database.database import SessionLocal
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.desk_status_history import DeskStatusHistory

def cleanup_desk_numbers():
    db = SessionLocal()
    try:
        # Find all desks with 4-digit desk numbers
        all_desks = db.query(Desk).all()
        four_digit_desks = [d for d in all_desks if len(d.desk_number) >= 4]
        
        if not four_digit_desks:
            print("✓ No 4-digit desk numbers found. Database is clean!")
            return
        
        print(f"Found {len(four_digit_desks)} desks with 4+ digit numbers:")
        for desk in four_digit_desks:
            print(f"  - Desk {desk.desk_number} (Floor {desk.floor})")
        
        # Delete assignments and history for these desks
        for desk in four_digit_desks:
            # Delete assignments
            assignments = db.query(DeskAssignment).filter(DeskAssignment.desk_id == desk.id).all()
            for assignment in assignments:
                print(f"  Deleting assignment for desk {desk.desk_number}")
                db.delete(assignment)
            
            # Delete status history
            history = db.query(DeskStatusHistory).filter(DeskStatusHistory.desk_id == desk.id).all()
            for h in history:
                print(f"  Deleting status history for desk {desk.desk_number}")
                db.delete(h)
            
            # Delete the desk
            print(f"  Deleting desk {desk.desk_number}")
            db.delete(desk)
        
        db.commit()
        print(f"\n✓ Successfully removed {len(four_digit_desks)} desks with 4-digit numbers")
        print("✓ All remaining desks now have 3-digit numbers (101-105, 201-206, 301-305)")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting desk number cleanup...")
    cleanup_desk_numbers()
    print("Cleanup complete!")
