from datetime import date
from sqlalchemy.orm import Session

from app.models.desk_assignments import DeskAssignment
from app.models.desks import Desk


def extract_floor_and_index(desk_number: int | str):
    """
    Desk number format:
    3-digit: FLOOR(1) + INDEX(2) (e.g., 205 -> floor 2, index 5)
    4-digit: FLOOR(1) * 1000 + INDEX (e.g., 2003 -> floor 2, index 3)
    """
    # Convert to int if it's a string
    try:
        dn = int(desk_number)
    except (ValueError, TypeError):
        raise ValueError("Desk number must be numeric")

    if dn >= 1000:
        floor = dn // 1000
        desk_index = dn % 1000
    elif dn >= 100:
        floor = dn // 100
        desk_index = dn % 100
    else:
        raise ValueError("Desk number must be at least 3 digits")

    if desk_index < 0 or desk_index > 999: # More relaxed index check
        raise ValueError("Invalid desk index")

    return floor, desk_index


def desk_has_conflict(
    db: Session,
    desk_id: str,
    shift: str,
    start: date,
    end: date,
) -> bool:
    """
    Check if a desk already has an assignment for the same shift
    with an overlapping date range.

    Overlap rule:
    existing.start_date <= new_end AND existing.end_date >= new_start
    """
    conflict_query = (
        db.query(DeskAssignment)
        .filter(DeskAssignment.desk_id == desk_id)
        .filter(DeskAssignment.shift == shift)
        .filter(DeskAssignment.start_date <= end)
        .filter(DeskAssignment.end_date >= start)
    )
    return db.query(conflict_query.exists()).scalar()


def find_available_desk_for_range(
    db: Session,
    candidate_desks: list[Desk],
    shift: str,
    start: date,
    end: date,
) -> Desk | None:
    """
    Given a list of candidate desks, return the first one that has
    no conflicting assignment for the given shift and date range.
    """
    # Sort for deterministic behaviour (e.g. by desk_number)
    sorted_desks = sorted(candidate_desks, key=lambda d: d.desk_number)

    for desk in sorted_desks:
        if not desk_has_conflict(db, desk.id, shift, start, end):
            return desk

    return None

