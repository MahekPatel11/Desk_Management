import requests

BACKEND_URL = "http://127.0.0.1:8000"


def login(email: str, password: str, role: str) -> str:
    """Helper to login and return JWT access token."""
    resp = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={"email": email, "password": password, "role": role},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data
    return data["access_token"]


def ensure_employee_user(email: str, password: str) -> None:
    """
    Ensure an EMPLOYEE user exists for tests.
    Uses /auth/register; if the email already exists, ignore 400.
    """
    resp = requests.post(
        f"{BACKEND_URL}/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Test Employee",
            "role": "EMPLOYEE",
        },
    )
    if resp.status_code not in (200, 400):
        # Any other failure is unexpected
        raise AssertionError(f"Failed to ensure test employee user: {resp.text}")


def ensure_it_support_user(email: str, password: str) -> None:
    """
    Ensure an IT_SUPPORT user exists for tests.
    Uses /auth/register; if the email already exists, ignore 400.
    """
    resp = requests.post(
        f"{BACKEND_URL}/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Test IT Support",
            "role": "IT_SUPPORT",
        },
    )
    if resp.status_code not in (200, 400):
        raise AssertionError(f"Failed to ensure test IT support user: {resp.text}")


def test_admin_can_view_desks_and_assign_to_employee():
    """
    High-level E2E-style test that:
    1) Logs in as IT_SUPPORT (has permissions to view desks and assign)
    2) Fetches desks and employees
    3) Picks an AVAILABLE desk and an employee
    4) Assigns the desk
    5) Verifies the desk is now ASSIGNED in the list
    """
    # 1) Login as IT_SUPPORT
    token = login("itsupport-user@example.com", "itsupport123", "IT_SUPPORT")
    headers = {"Authorization": f"Bearer {token}"}

    # 2) Fetch desks (FastAPI router is mounted at /desks)
    resp_desks = requests.get(f"{BACKEND_URL}/desks/?size=50", headers=headers)
    assert resp_desks.status_code == 200, resp_desks.text
    desks_data = resp_desks.json()
    desks = desks_data.get("data", desks_data)
    assert isinstance(desks, list)

    # Choose first AVAILABLE desk
    available_desks = [d for d in desks if d.get("current_status") == "AVAILABLE"]
    assert available_desks, "No AVAILABLE desks to test with"
    desk = available_desks[0]

    # 3) Fetch employees (router is mounted at /employees, no pagination params)
    resp_emps = requests.get(f"{BACKEND_URL}/employees/", headers=headers)
    assert resp_emps.status_code == 200, resp_emps.text
    employees = resp_emps.json()
    assert isinstance(employees, list)
    employee = employees[0]

    # 4) Assign desk (endpoint: POST /desks/assign-desk)
    assignment_payload = {
        "desk_id": desk["id"],
        "employee_id": employee["id"],
        "assignment_type": "PERMANENT",
        "notes": "E2E test assignment",
        "date": "2025-01-01",
    }

    resp_assign = requests.post(
        f"{BACKEND_URL}/desks/assign-desk",
        json=assignment_payload,
        headers=headers,
    )
    assert resp_assign.status_code == 200, resp_assign.text

    # 5) Verify desk is now ASSIGNED
    resp_desks_after = requests.get(f"{BACKEND_URL}/desks/?size=50", headers=headers)
    assert resp_desks_after.status_code == 200, resp_desks_after.text
    desks_after = resp_desks_after.json().get("data", desks)

    updated = next(d for d in desks_after if d["id"] == desk["id"])
    assert updated["current_status"] == "ASSIGNED"


def test_employee_cannot_access_admin_desks_endpoint_directly():
    """
    Verify that an EMPLOYEE token cannot access admin-protected desks endpoint.

    This test creates (or reuses) a dedicated test employee user via /auth/register
    so it does not depend on seed data.
    """
    email = "test-employee@example.com"
    password = "testpassword123"

    ensure_employee_user(email=email, password=password)

    token = login(email, password, "EMPLOYEE")
    headers = {"Authorization": f"Bearer {token}"}

    resp = requests.post(
        f"{BACKEND_URL}/desks/assign-desk",
        json={},
        headers=headers,
    )

    # Depending on your implementation this might be 401 or 403.
    # Adjust expected code if needed.
    assert resp.status_code in (401, 403)


def test_password_reset_flow_for_employee_e2e():
    """
    E2E test for password reset using JWT:
    1) Ensure a test EMPLOYEE user exists
    2) Request a reset token via /auth/forgot-password
    3) Reset password via /auth/reset-password
    4) Login with new password succeeds, old password fails
    """
    email = "reset-user@example.com"
    original_password = "origPass123"
    new_password = "newPass456"

    # 1) Ensure user exists
    ensure_employee_user(email=email, password=original_password)

    # 2) Request reset token
    resp_forgot = requests.post(
        f"{BACKEND_URL}/auth/forgot-password",
        json={"email": email},
    )
    assert resp_forgot.status_code == 200, resp_forgot.text
    data_forgot = resp_forgot.json()
    assert "reset_token" in data_forgot
    token = data_forgot["reset_token"]

    # 3) Reset password
    resp_reset = requests.post(
        f"{BACKEND_URL}/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert resp_reset.status_code == 200, resp_reset.text

    # 4a) Login with new password should succeed
    resp_login_new = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={"email": email, "password": new_password, "role": "EMPLOYEE"},
    )
    assert resp_login_new.status_code == 200, resp_login_new.text

    # 4b) Login with old password should fail
    resp_login_old = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={"email": email, "password": original_password, "role": "EMPLOYEE"},
    )
    assert resp_login_old.status_code == 401


def test_it_support_can_put_desk_into_maintenance():
    """
    E2E test:
    1) Ensure an IT_SUPPORT user exists and login
    2) Fetch desks and pick any desk
    3) PUT /desks/by-number/{desk_number} to set status to MAINTENANCE
    4) Verify the desk's status is MAINTENANCE
    """
    email = "itsupport-user@example.com"
    password = "itsupport123"

    ensure_it_support_user(email=email, password=password)

    token = login(email, password, "IT_SUPPORT")
    headers = {"Authorization": f"Bearer {token}"}

    # 2) Fetch desks
    resp_desks = requests.get(f"{BACKEND_URL}/desks/?size=50", headers=headers)
    assert resp_desks.status_code == 200, resp_desks.text
    desks_data = resp_desks.json()
    desks = desks_data.get("data", desks_data)
    assert isinstance(desks, list)
    assert desks, "No desks available for maintenance test"

    desk = desks[0]
    desk_number = desk["desk_number"]

    # 3) Update status to MAINTENANCE
    payload = {
        "current_status": "MAINTENANCE",
        "reason": "E2E maintenance test",
        "notes": "Automated test",
        "expected_resolution_date": None,
    }

    resp_update = requests.put(
        f"{BACKEND_URL}/desks/by-number/{desk_number}",
        json=payload,
        headers=headers,
    )
    assert resp_update.status_code == 200, resp_update.text

    # 4) Fetch desks again and verify
    resp_desks_after = requests.get(f"{BACKEND_URL}/desks/?size=50", headers=headers)
    assert resp_desks_after.status_code == 200, resp_desks_after.text
    desks_after = resp_desks_after.json().get("data", desks)

    updated = next(d for d in desks_after if d["desk_number"] == desk_number)
    assert updated["current_status"] == "MAINTENANCE"


def test_desks_filtering_by_floor():
    """
    E2E test for desk filtering by floor:
    1) Login as IT_SUPPORT (has permissions to view desks)
    2) Fetch desks with floor filter parameter
    3) Verify only desks from the requested floor are returned
    4) Verify desk numbers match the expected floor format
    """
    token = login("itsupport-user@example.com", "itsupport123", "IT_SUPPORT")
    headers = {"Authorization": f"Bearer {token}"}

    # 1) Fetch desks without filter to get available floors
    resp_all_desks = requests.get(
        f"{BACKEND_URL}/desks/?size=50",
        headers=headers,
    )
    assert resp_all_desks.status_code == 200, resp_all_desks.text
    all_desks = resp_all_desks.json().get("data", resp_all_desks.json())
    assert len(all_desks) > 0, "No desks available"

    # Get unique floors from desks
    floors = list(set(d.get("floor") for d in all_desks if d.get("floor")))
    assert len(floors) > 0, "No floors found in desks"

    # 2) Filter by first floor (convert to int if it's a string)
    floor_to_filter = floors[0]
    # Extract numeric value if floor is formatted as "Floor X"
    if isinstance(floor_to_filter, str) and floor_to_filter.startswith("Floor"):
        floor_numeric = int(floor_to_filter.split()[-1])
    else:
        floor_numeric = int(floor_to_filter)
    
    resp_filtered = requests.get(
        f"{BACKEND_URL}/desks/?floor={floor_numeric}&size=50",
        headers=headers,
    )
    assert resp_filtered.status_code == 200, resp_filtered.text
    filtered_desks = resp_filtered.json().get("data", resp_filtered.json())

    # 3) Verify all returned desks match the floor filter
    for desk in filtered_desks:
        desk_floor = desk.get("floor")
        # Convert to int for comparison
        if isinstance(desk_floor, str) and desk_floor.startswith("Floor"):
            desk_floor_numeric = int(desk_floor.split()[-1])
        else:
            desk_floor_numeric = int(desk_floor)
        
        assert desk_floor_numeric == floor_numeric, \
            f"Desk {desk.get('desk_number')} has floor {desk_floor_numeric}, expected {floor_numeric}"

    # 4) Verify we got results
    assert len(filtered_desks) > 0, f"No desks found for floor {floor_numeric}"


def test_desk_status_transition_and_history():
    """
    E2E test for desk status transitions and history tracking:
    1) Login as IT_SUPPORT
    2) Fetch a desk and its initial status
    3) Change status from current to MAINTENANCE
    4) Fetch desk history via /desks/by-number/{desk_number}/history
    5) Verify the history contains the status change entry
    6) Change status back to AVAILABLE
    7) Verify history shows both transitions
    """
    email = "itsupport-history@example.com"
    password = "itsupport123"

    ensure_it_support_user(email=email, password=password)

    token = login(email, password, "IT_SUPPORT")
    headers = {"Authorization": f"Bearer {token}"}

    # 1) Fetch desks to pick one
    resp_desks = requests.get(f"{BACKEND_URL}/desks/?size=50", headers=headers)
    assert resp_desks.status_code == 200, resp_desks.text
    desks_data = resp_desks.json()
    desks = desks_data.get("data", desks_data)
    assert len(desks) > 0, "No desks available"

    desk = desks[0]
    desk_number = desk["desk_number"]
    initial_status = desk["current_status"]

    # 2) Change status to MAINTENANCE
    payload_maintenance = {
        "current_status": "MAINTENANCE",
        "reason": "E2E history test",
        "notes": "Testing status history",
        "expected_resolution_date": None,
    }

    resp_update_maint = requests.put(
        f"{BACKEND_URL}/desks/by-number/{desk_number}",
        json=payload_maintenance,
        headers=headers,
    )
    assert resp_update_maint.status_code == 200, resp_update_maint.text

    # 3) Fetch desk history
    resp_history = requests.get(
        f"{BACKEND_URL}/desks/by-number/{desk_number}/history",
        headers=headers,
    )
    assert resp_history.status_code == 200, resp_history.text
    history = resp_history.json()
    assert isinstance(history, list), "History should be a list"

    # 4) Verify MAINTENANCE status is in history
    maintenance_entry = next(
        (h for h in history if h.get("status") == "MAINTENANCE"),
        None
    )
    assert maintenance_entry is not None, "MAINTENANCE status not found in history"

    # 5) Change status back to AVAILABLE
    payload_available = {
        "current_status": "AVAILABLE",
        "reason": "E2E history test - returning to available",
        "notes": "Testing status history completion",
        "expected_resolution_date": None,
    }

    resp_update_avail = requests.put(
        f"{BACKEND_URL}/desks/by-number/{desk_number}",
        json=payload_available,
        headers=headers,
    )
    assert resp_update_avail.status_code == 200, resp_update_avail.text

    # 6) Fetch history again and verify both transitions are recorded
    resp_history_final = requests.get(
        f"{BACKEND_URL}/desks/by-number/{desk_number}/history",
        headers=headers,
    )
    assert resp_history_final.status_code == 200, resp_history_final.text
    history_final = resp_history_final.json()

    # Verify we have at least 2 entries (MAINTENANCE and AVAILABLE)
    assert len(history_final) >= 2, "History should have at least 2 entries"

    # Verify status changes are in order (most recent first)
    statuses = [h.get("status") for h in history_final]
    assert "AVAILABLE" in statuses, "AVAILABLE status not found in history"
    assert "MAINTENANCE" in statuses, "MAINTENANCE status not found in history"


