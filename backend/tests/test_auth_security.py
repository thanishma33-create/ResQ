import pytest
import datetime
from fastapi.testclient import TestClient
from auth import get_password_hash, create_access_token
import models
from tests.conftest import TestingSessionLocal

def get_token_for(client: TestClient, username: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Failed to login {username}: {res.text}"
    return res.json()["access_token"]


def test_valid_citizen_login(client: TestClient):
    """Test 1: Valid citizen login."""
    res = client.post("/api/auth/login", json={"username_or_email": "testcitizen", "password": "Citizen@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "citizen"


def test_valid_volunteer_login(client: TestClient):
    """Test 2: Valid volunteer login."""
    db = TestingSessionLocal()
    if not db.query(models.User).filter(models.User.username == "testvol").first():
        v = models.User(
            username="testvol",
            email="testvol@resq.org",
            hashed_password=get_password_hash("Vol@123"),
            full_name="Volunteer User",
            role="volunteer",
            is_active=True
        )
        db.add(v)
        db.commit()
    db.close()

    token = get_token_for(client, "testvol", "Vol@123")
    assert token is not None


def test_valid_rescue_team_login(client: TestClient):
    """Test 3: Valid rescue team login."""
    db = TestingSessionLocal()
    if not db.query(models.User).filter(models.User.username == "testrescue").first():
        r = models.User(
            username="testrescue",
            email="testrescue@resq.org",
            hashed_password=get_password_hash("Rescue@123"),
            full_name="Rescue Leader",
            role="rescue_team",
            is_active=True
        )
        db.add(r)
        db.commit()
    db.close()

    token = get_token_for(client, "testrescue", "Rescue@123")
    assert token is not None


def test_valid_operator_login(client: TestClient):
    """Test 4: Valid operator login."""
    token = get_token_for(client, "testoperator", "Operator@123")
    assert token is not None


def test_valid_admin_login(client: TestClient):
    """Test 5: Valid admin login."""
    token = get_token_for(client, "testadmin", "Admin@123")
    assert token is not None


def test_invalid_password(client: TestClient):
    """Test 6: Invalid password returns 401."""
    res = client.post("/api/auth/login", json={"username_or_email": "testadmin", "password": "WrongPassword"})
    assert res.status_code == 401
    assert "Invalid" in res.json()["detail"]


def test_invalid_username(client: TestClient):
    """Test 7: Invalid username returns 401."""
    res = client.post("/api/auth/login", json={"username_or_email": "nonexistentuser", "password": "AnyPassword"})
    assert res.status_code == 401


def test_expired_jwt(client: TestClient):
    """Test 8: Expired JWT returns 401."""
    expired_token = create_access_token(
        data={"sub": "testadmin", "role": "admin", "user_id": 1},
        expires_delta=datetime.timedelta(seconds=-10)
    )
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_missing_jwt(client: TestClient):
    """Test 9: Missing JWT on protected endpoint returns 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_citizen_calling_admin_endpoint(client: TestClient):
    """Test 10: Citizen calling admin-only endpoint returns 403."""
    citizen_token = get_token_for(client, "testcitizen", "Citizen@123")
    res = client.patch("/api/auth/users/1/status?is_active=false", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 403


def test_volunteer_calling_admin_endpoint(client: TestClient):
    """Test 11: Volunteer calling admin endpoint returns 403."""
    vol_token = get_token_for(client, "testvol", "Vol@123")
    res = client.patch("/api/auth/users/1/status?is_active=false", headers={"Authorization": f"Bearer {vol_token}"})
    assert res.status_code == 403


def test_rescue_team_calling_admin_endpoint(client: TestClient):
    """Test 12: Rescue team calling admin endpoint returns 403."""
    rescue_token = get_token_for(client, "testrescue", "Rescue@123")
    res = client.patch("/api/auth/users/1/status?is_active=false", headers={"Authorization": f"Bearer {rescue_token}"})
    assert res.status_code == 403


def test_operator_calling_admin_only_status_endpoint(client: TestClient):
    """Test 13: Operator calling strict admin-only endpoint returns 403."""
    op_token = get_token_for(client, "testoperator", "Operator@123")
    res = client.patch("/api/auth/users/1/status?is_active=false", headers={"Authorization": f"Bearer {op_token}"})
    assert res.status_code == 403
    assert "Admin access required" in res.json()["detail"]


def test_admin_calling_admin_endpoint(client: TestClient):
    """Test 14: Admin calling admin endpoint succeeds."""
    admin_token = get_token_for(client, "testadmin", "Admin@123")
    res = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_public_registration_rejects_admin_role(client: TestClient):
    """Test 15: Public registration attempting role=admin is rejected with 403."""
    payload = {
        "username": "hacker_admin",
        "email": "hacker@resq.org",
        "password": "Password123!",
        "full_name": "Unauthorized Admin Attempt",
        "role": "admin",
        "phone": "+91 99999 99999"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 403
    assert "restricted" in res.json()["detail"].lower()


def test_disabled_user_login(client: TestClient):
    """Test 17: Disabled user account cannot authenticate."""
    db = TestingSessionLocal()
    disabled_user = models.User(
        username="disabled_account",
        email="disabled@resq.org",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Disabled User",
        role="citizen",
        is_active=False
    )
    db.add(disabled_user)
    db.commit()
    db.close()

    res = client.post("/api/auth/login", json={"username_or_email": "disabled_account", "password": "Pass@123"})
    assert res.status_code == 403
    assert "deactivated" in res.json()["detail"].lower()


def test_admin_audit_logging(client: TestClient):
    """Test 18: Admin actions generate audit log entries."""
    admin_token = get_token_for(client, "testadmin", "Admin@123")
    audit_res = client.get("/api/audit/", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    logs = audit_res.json()
    actions = [log["action"] for log in logs]
    assert "ADMIN_LOGIN" in actions or "LOGIN" in actions


def test_no_plaintext_passwords_in_db_or_responses(client: TestClient):
    """Test 20: Passwords in database are bcrypt hashed and omitted from /auth/me."""
    admin_token = get_token_for(client, "testadmin", "Admin@123")
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert "password" not in user_data
    assert "hashed_password" not in user_data

    # Verify DB column starts with bcrypt prefix ($2b$ or $2a$)
    db = TestingSessionLocal()
    db_user = db.query(models.User).filter(models.User.username == "testadmin").first()
    assert db_user.hashed_password.startswith("$2")
    db.close()


def test_auth_me_returns_authoritative_role(client: TestClient):
    """Test 25: GET /auth/me and /api/auth/me return authoritative DB role."""
    admin_token = get_token_for(client, "testadmin", "Admin@123")
    res1 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res1.status_code == 200
    assert res1.json()["role"] == "admin"

    res2 = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 200
    assert res2.json()["role"] == "admin"
