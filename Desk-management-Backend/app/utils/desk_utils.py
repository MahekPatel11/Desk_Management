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
