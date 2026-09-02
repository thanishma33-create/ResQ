import pytest
import datetime
from fastapi.testclient import TestClient
import models
from tests.conftest import TestingSessionLocal

def test_normal_sos_creation(client: TestClient):
    """Test standard SOS creation without client_sos_id."""
    payload = {
        "name": "Arjun Kumar",
        "phone": "+91 98765 43210",
        "latitude": 8.5241,
        "longitude": 76.9366,
        "people": 3,
        "message": "Trapped on terrace with rising floodwaters",
        "medical_needed": True,
        "trapped": True
    }
    response = client.post("/api/sos/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["duplicate"] is False
    assert data["priority_score"] >= 75.0
    assert data["severity"] in ["HIGH", "CRITICAL"]
    assert data["status"] == "PENDING"


def test_sos_creation_with_client_sos_id(client: TestClient):
    """Test SOS creation with a unique frontend client_sos_id."""
    client_id = "SOS-2026-TEST-001"
    payload = {
        "client_sos_id": client_id,
        "name": "Priya Nair",
        "phone": "+91 98765 11111",
        "latitude": 8.5300,
        "longitude": 76.9400,
        "gps_accuracy": 12.5,
        "people": 2,
        "message": "Senior citizen needing insulin and extraction",
        "medical_needed": True,
        "trapped": False,
        "elderly": 1
    }
    response = client.post("/api/sos/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["duplicate"] is False
    assert data["client_sos_id"] == client_id
    assert data["emergency_id"] > 0


def test_same_client_sos_id_idempotency_retry(client: TestClient):
    """Test that submitting the exact same client_sos_id returns duplicate=True without creating a new record."""
    client_id = "SOS-2026-TEST-IDEMPOTENT-002"
    payload = {
        "client_sos_id": client_id,
        "name": "Rahul Varma",
        "phone": "+91 98765 22222",
        "latitude": 8.5100,
        "longitude": 76.9200,
        "people": 1,
        "message": "First transmission attempt"
    }
    
    # 1. First Attempt: Creates emergency
    res1 = client.post("/api/sos/", json=payload)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["duplicate"] is False
    original_id = data1["emergency_id"]

    # 2. Second Attempt (Retry): Returns existing emergency with duplicate=True
    res2 = client.post("/api/sos/", json=payload)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["duplicate"] is True
    assert data2["emergency_id"] == original_id
    assert data2["client_sos_id"] == client_id
    assert "already synchronized" in data2["message"].lower()

    # 3. Verify in database that only ONE record was created with this client_sos_id
    db = TestingSessionLocal()
    records = db.query(models.Emergency).filter(models.Emergency.client_sos_id == client_id).all()
    assert len(records) == 1
    db.close()


def test_batch_sos_synchronization(client: TestClient):
    """Test POST /api/sos/sync with mixed new and duplicate items."""
    item1_id = "SOS-2026-BATCH-001"
    item2_id = "SOS-2026-BATCH-002"

    # Pre-create item1 to simulate existing sync
    client.post("/api/sos/", json={
        "client_sos_id": item1_id,
        "name": "Pre-existing User",
        "phone": "+91 98765 33333",
        "latitude": 8.5000,
        "longitude": 76.9000,
        "people": 1
    })

    batch_payload = {
        "items": [
            {
                "client_sos_id": item1_id,
                "name": "Pre-existing User",
                "phone": "+91 98765 33333",
                "latitude": 8.5000,
                "longitude": 76.9000,
                "people": 1
            },
            {
                "client_sos_id": item2_id,
                "name": "Batch User 2",
                "phone": "+91 98765 44444",
                "latitude": 8.5500,
                "longitude": 76.9500,
                "people": 4,
                "medical_needed": True
            }
        ]
    }

    response = client.post("/api/sos/sync", json=batch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total"] == 2
    assert data["synced_count"] == 1
    assert data["already_synced_count"] == 1
    assert data["failed_count"] == 0

    results = data["results"]
    assert results[0]["client_sos_id"] == item1_id
    assert results[0]["status"] == "already_synced"
    assert results[0]["duplicate"] is True

    assert results[1]["client_sos_id"] == item2_id
    assert results[1]["status"] == "synced"
    assert results[1]["duplicate"] is False
    assert results[1]["emergency_id"] > 0


def test_batch_sos_partial_failure_isolation(client: TestClient):
    """Test that a single invalid item does not fail other valid items in the batch."""
    batch_payload = {
        "items": [
            {
                "client_sos_id": "SOS-INVALID-LAT",
                "name": "Bad Coords",
                "phone": "+91 98765 55555",
                "latitude": 999.0,  # Invalid latitude > 90
                "longitude": 76.9000,
                "people": 1
            },
            {
                "client_sos_id": "SOS-VALID-ITEM",
                "name": "Good Item",
                "phone": "+91 98765 66666",
                "latitude": 8.5200,
                "longitude": 76.9200,
                "people": 2
            }
        ]
    }

    response = client.post("/api/sos/sync", json=batch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["failed_count"] == 1
    assert data["synced_count"] == 1

    results = data["results"]
    assert results[0]["status"] == "failed"
    assert "latitude" in results[0]["error"].lower()

    assert results[1]["status"] == "synced"
    assert results[1]["emergency_id"] > 0


def test_offline_timestamp_preservation_and_latency_scoring(client: TestClient):
    """Test that client_created_at is preserved and affects waiting time penalty in priority scoring."""
    client_id = "SOS-2026-TIMESTAMP-001"
    # Offline timestamp 45 minutes in the past
    past_time = datetime.datetime.utcnow() - datetime.timedelta(minutes=45)

    payload = {
        "client_sos_id": client_id,
        "name": "Devi Parvathy",
        "phone": "+91 98765 77777",
        "latitude": 8.5250,
        "longitude": 76.9350,
        "people": 2,
        "trapped": True,
        "client_created_at": past_time.isoformat()
    }

    response = client.post("/api/sos/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["emergency_id"] > 0
    assert data["client_created_at"] is not None
    assert data["server_received_at"] is not None

    # Inspect database record
    db = TestingSessionLocal()
    rec = db.query(models.Emergency).filter(models.Emergency.client_sos_id == client_id).first()
    assert rec is not None
    assert rec.client_created_at is not None
    assert rec.server_received_at is not None
    # Verify latency reason was added to AI priority reasons
    reasons = rec.priority_reasons
    assert "Offline wait latency" in reasons
    db.close()


def test_coordinate_validation_single_endpoint(client: TestClient):
    """Test that invalid coordinates return HTTP 422 on single SOS endpoint."""
    bad_lat = {
        "name": "Test",
        "phone": "+91 98765 88888",
        "latitude": 105.0,  # Invalid
        "longitude": 76.9000
    }
    res1 = client.post("/api/sos/", json=bad_lat)
    assert res1.status_code == 422

    bad_lon = {
        "name": "Test",
        "phone": "+91 98765 88888",
        "latitude": 8.5200,
        "longitude": -200.0  # Invalid
    }
    res2 = client.post("/api/sos/", json=bad_lon)
    assert res2.status_code == 422


def test_audit_log_created_for_sos(client: TestClient):
    """Test that audit log entries are created on SOS sync."""
    client_id = "SOS-AUDIT-TEST-001"
    payload = {
        "client_sos_id": client_id,
        "name": "Audit Tester",
        "phone": "+91 98765 99999",
        "latitude": 8.5210,
        "longitude": 76.9310,
        "people": 1
    }
    
    # 1. Sync new SOS -> OFFLINE_SOS_SYNCED
    client.post("/api/sos/", json=payload)

    # 2. Retry same SOS -> OFFLINE_SOS_ALREADY_SYNCED
    client.post("/api/sos/", json=payload)

    db = TestingSessionLocal()
    logs = db.query(models.AuditLog).filter(
        models.AuditLog.action.in_(["OFFLINE_SOS_SYNCED", "OFFLINE_SOS_ALREADY_SYNCED"])
    ).all()
    actions = [l.action for l in logs]
    assert "OFFLINE_SOS_SYNCED" in actions
    assert "OFFLINE_SOS_ALREADY_SYNCED" in actions
    db.close()
