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
    1) Logs in as ADMIN
    2) Fetches desks and employees
    3) Picks an AVAILABLE desk and an employee
    4) Assigns the desk
    5) Verifies the desk is now ASSIGNED in the list
    """
    # 1) Login as admin
    token = login("sarah@company.com", "admin123", "ADMIN")
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


