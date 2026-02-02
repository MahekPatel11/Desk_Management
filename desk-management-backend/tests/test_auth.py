from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_login_success():
    response = client.post(
        "/auth/login",
        json={
            "email": "amit.sharma@company.com",
            "password": "admin123",
            "role": "ADMIN"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "ADMIN"


def test_login_wrong_role():
    response = client.post(
        "/auth/login",
        json={
            "email": "amit.sharma@company.com",
            "password": "admin123",
            "role": "EMPLOYEE"
        }
    )

    assert response.status_code == 403


def test_login_wrong_password():
    response = client.post(
        "/auth/login",
        json={
            "email": "amit.sharma@company.com",
            "password": "wrongpass",
            "role": "ADMIN"
        }
    )

    assert response.status_code == 401
