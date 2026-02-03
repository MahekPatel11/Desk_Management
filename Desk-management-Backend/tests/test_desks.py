import requests
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

# Credentials from seed_db.py
ADMIN_EMAIL = "sarah@company.com"
ADMIN_PASS = "admin123"

IT_EMAIL = "alex@company.com"
IT_PASS = "it123"

def get_token(email, password, role):
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password,
        "role": role
    })
    if res.status_code == 200:
        return res.json()["access_token"]
    return None

def test_list_desks():
    print("Testing Desk Listing (Admin)...")
    token = get_token(ADMIN_EMAIL, ADMIN_PASS, "ADMIN")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/desks", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) > 0
    print(f"✓ Successfully listed {len(data)} desks.")

def test_update_desk_status():
    print("Testing Desk Status Update (IT Support)...")
    token = get_token(IT_EMAIL, IT_PASS, "IT_SUPPORT")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Update Desk 101 to MAINTENANCE
    response = requests.put(
        f"{BASE_URL}/desks/by-number/101",
        json={
            "current_status": "MAINTENANCE",
            "reason": "Test maintenance",
            "notes": "Automated test"
        },
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["new_status"] == "MAINTENANCE"
    print("✓ Successfully updated Desk 101 to MAINTENANCE.")

    # Reset Desk 101 to AVAILABLE
    requests.put(
        f"{BASE_URL}/desks/by-number/101",
        json={"current_status": "AVAILABLE", "reason": "Resetting for tests"},
        headers=headers
    )
    print("✓ Successfully reset Desk 101 to AVAILABLE.")

def test_reassignment_logic():
    print("Testing Reassignment & Desk Release Logic (Admin)...")
    token = get_token(ADMIN_EMAIL, ADMIN_PASS, "ADMIN")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Find Desk 101, 102 and John Doe
    desks = requests.get(f"{BASE_URL}/desks", headers=headers).json()["data"]
    desk_101 = next(d for d in desks if d["desk_number"] == "101")
    desk_102 = next(d for d in desks if d["desk_number"] == "102")
    
    employees = requests.get(f"{BASE_URL}/employees", headers=headers).json()
    john = next(e for e in employees if e["name"] == "John Doe")

    # 2. Assign John to 101
    requests.post(
        f"{BASE_URL}/desks/assign-desk",
        json={
            "desk_id": desk_101["id"],
            "employee_id": john["id"],
            "assignment_type": "PERMANENT",
            "date": str(date.today())
        },
        headers=headers
    )
    print(f"✓ Assigned {john['name']} to Desk 101.")

    # 3. Reassign John to 102
    requests.post(
        f"{BASE_URL}/desks/assign-desk",
        json={
            "desk_id": desk_102["id"],
            "employee_id": john["id"],
            "assignment_type": "PERMANENT",
            "date": str(date.today())
        },
        headers=headers
    )
    print(f"✓ Reassigned {john['name']} to Desk 102.")

    # 4. Verify Desk 101 is released (AVAILABLE)
    desks = requests.get(f"{BASE_URL}/desks", headers=headers).json()["data"]
    refreshed_101 = next(d for d in desks if d["desk_number"] == "101")
    assert refreshed_101["current_status"] == "AVAILABLE"
    print("✓ Verified Desk 101 was automatically released to AVAILABLE.")

if __name__ == "__main__":
    test_list_desks()
    test_update_desk_status()
    test_reassignment_logic()
