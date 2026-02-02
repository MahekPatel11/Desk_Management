def extract_floor_and_index(desk_number: int):
    """
    Desk number format:
    FLOOR * 1000 + DESK_INDEX
    Example: 2003 -> floor=2, desk_index=3
    """

    if desk_number < 1000:
        raise ValueError("Invalid desk number format")

    floor = desk_number // 1000
    desk_index = desk_number % 1000

    if desk_index < 1 or desk_index > 100:
        raise ValueError("Desk index must be between 001 and 100")

    return floor, desk_index
