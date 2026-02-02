from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)




def get_admin_token():
    response = client.post(
        "/auth/login",
        json={
            "email": "amit.sharma@company.com",
            "password": "admin123",
            "role": "ADMIN"
        }
    )
    return response.json()["access_token"]


def test_list_desks():
    token = get_admin_token()

    response = client.get(
        "/desks",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200

    body = response.json()

    # paginated response
    assert isinstance(body, dict)
    assert "data" in body
    assert isinstance(body["data"], list)




def test_update_desk_status():
    token = get_admin_token()

    response = client.put(
        "/desks/by-number/2003",
        json={
            "current_status": "MAINTENANCE",
            "reason": "Maintenance scheduled by admin"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["new_status"] == "MAINTENANCE"



def test_assign_desk():
    token = get_admin_token()

    response = client.post(
        "/desks/assign-desk",
        json={
            "desk_id": "REPLACE_WITH_REAL_DESK_UUID",
            "employee_id": "REPLACE_WITH_REAL_EMPLOYEE_UUID",
            "assignment_type": "PERMANENT"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
