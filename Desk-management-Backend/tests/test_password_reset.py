import requests

BASE_URL = "http://127.0.0.1:8000"


def test_password_reset_flow_for_employee():
  """
  End‑to‑end test for password reset using JWT token:
  1) Request reset token for an existing employee email
  2) Reset password using the token
  3) Login with the new password should succeed
  4) Login with the old password should fail
  """
  email = "john@company.com"
  old_password = "password"
  new_password = "newpass123"

  # 1) Request reset token
  resp_forgot = requests.post(
      f"{BASE_URL}/auth/forgot-password",
      json={"email": email},
  )
  assert resp_forgot.status_code == 200
  data_forgot = resp_forgot.json()
  assert "reset_token" in data_forgot
  reset_token = data_forgot["reset_token"]

  # 2) Reset password using the token
  resp_reset = requests.post(
      f"{BASE_URL}/auth/reset-password",
      json={"token": reset_token, "new_password": new_password},
  )
  assert resp_reset.status_code == 200

  # 3) Login with new password should succeed
  resp_login_new = requests.post(
      f"{BASE_URL}/auth/login",
      json={
          "email": email,
          "password": new_password,
          "role": "EMPLOYEE",
      },
  )
  assert resp_login_new.status_code == 200
  assert "access_token" in resp_login_new.json()

  # 4) Login with old password should now fail
  resp_login_old = requests.post(
      f"{BASE_URL}/auth/login",
      json={
          "email": email,
          "password": old_password,
          "role": "EMPLOYEE",
      },
  )
  assert resp_login_old.status_code == 401

