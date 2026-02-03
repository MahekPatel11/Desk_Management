import requests

BASE_URL = "http://127.0.0.1:8000"

def test_admin_login_success():
    print("Testing Admin Login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "sarah@company.com",
            "password": "admin123",
            "role": "ADMIN"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "ADMIN"
    print("✓ Admin Login successful.")

def test_login_wrong_role():
    print("Testing Login with wrong role...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "sarah@company.com",
            "password": "admin123",
            "role": "EMPLOYEE"
        }
    )
    assert response.status_code == 403
    print("✓ Wrong role rejected (Expected 403).")

def test_login_wrong_password():
    print("Testing Login with wrong password...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "sarah@company.com",
            "password": "wrongpass",
            "role": "ADMIN"
        }
    )
    assert response.status_code == 401
    print("✓ Wrong password rejected (Expected 401).")

def test_it_support_login_success():
    print("Testing IT Support Login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "alex@company.com",
            "password": "it123",
            "role": "IT_SUPPORT"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "IT_SUPPORT"
    print("✓ IT Support Login successful.")

def test_employee_login_success():
    print("Testing Employee Login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "john@company.com",
            "password": "password",
            "role": "EMPLOYEE"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "EMPLOYEE"
    print("✓ Employee Login successful.")

if __name__ == "__main__":
    test_admin_login_success()
    test_login_wrong_role()
    test_login_wrong_password()
    test_it_support_login_success()
    test_employee_login_success()
