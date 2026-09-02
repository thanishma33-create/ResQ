import pytest
import io

def get_auth_token(client, username, password):
    resp = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]

def test_system_health(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "OPERATIONAL"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "HEALTHY"

def test_user_registration_and_login(client):
    # Register new citizen
    reg_payload = {
        "username": "kavitha_m",
        "email": "kavitha@example.com",
        "password": "Password@123",
        "full_name": "Kavitha Menon",
        "role": "citizen",
        "phone": "+91 98470 55443"
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "kavitha_m"
    assert data["role"] == "citizen"

    # Login
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "kavitha_m",
        "password": "Password@123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Get profile
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "kavitha@example.com"

def test_role_based_access_control(client):
    # Citizen token
    citizen_token = get_auth_token(client, "testcitizen", "Citizen@123")
    # Admin token
    admin_token = get_auth_token(client, "testadmin", "Admin@123")

    # Citizen trying to access audit logs (forbidden)
    forbidden_resp = client.get("/api/audit/", headers={"Authorization": f"Bearer {citizen_token}"})
    assert forbidden_resp.status_code == 403

    # Admin accessing audit logs (allowed)
    allowed_resp = client.get("/api/audit/", headers={"Authorization": f"Bearer {admin_token}"})
    assert allowed_resp.status_code == 200

def test_emergency_creation_and_ai_priority(client):
    payload = {
        "emergency_type": "flood_trapped",
        "description": "5 persons stranded on rooftop with elderly person and an infant.",
        "latitude": 8.4900,
        "longitude": 76.9600,
        "address": "Karamana River Side Road",
        "people_affected": 5,
        "children": 1,
        "elderly": 1,
        "pregnant_persons": 0,
        "disabled_persons": 0,
        "injured_persons": 0,
        "medical_required": False,
        "trapped": True,
        "required_resources": ["boats", "life_jackets"],
        "reporter_name": "Ravi Shankar",
        "reporter_phone": "+91 94470 12345"
    }
    resp = client.post("/api/emergencies/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["severity"] in ("HIGH", "CRITICAL")
    assert data["priority_score"] >= 30.0
    assert len(data["priority_reasons"]) > 0
    assert data["trapped"] is True

def test_sos_rapid_reporting(client):
    sos_payload = {
        "name": "Arjun Das",
        "phone": "+91 98471 99999",
        "latitude": 8.5100,
        "longitude": 76.9500,
        "people": 4,
        "message": "Water rapidly entering home. Immediate help needed!",
        "medical_needed": True,
        "trapped": True
    }
    resp = client.post("/api/sos/", json=sos_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["severity"] == "CRITICAL"
    assert data["priority_score"] >= 75.0
    assert data["emergency_id"] > 0

def test_duplicate_emergency_detection(client):
    # Create first emergency
    e1 = {
        "emergency_type": "landslide_block",
        "description": "Road blocked by heavy mud and fallen trees near Ponmudi curve 4.",
        "latitude": 8.7610,
        "longitude": 77.1150,
        "address": "Ponmudi Ghat Road Mile 4",
        "people_affected": 2,
        "trapped": True
    }
    resp1 = client.post("/api/emergencies/", json=e1)
    assert resp1.status_code == 201
    e1_id = resp1.json()["id"]

    # Create very nearby second emergency with similar description
    e2 = {
        "emergency_type": "landslide_block",
        "description": "Mudslide on road blocking vehicles near Ponmudi ghat curve 4.",
        "latitude": 8.7612,
        "longitude": 77.1152,
        "address": "Ponmudi Ghat Road Mile 4",
        "people_affected": 3,
        "trapped": True
    }
    resp2 = client.post("/api/emergencies/", json=e2)
    assert resp2.status_code == 201
    e2_data = resp2.json()
    
    # Should be flagged as suspected duplicate
    assert e2_data["is_duplicate"] is True
    assert e2_data["duplicate_of_id"] == e1_id

def test_ai_resource_recommendation_and_allocation(client):
    admin_token = get_auth_token(client, "testadmin", "Admin@123")

    # Create resource in inventory
    res_in = {
        "name": "Standard First Aid Packets",
        "category": "first_aid",
        "unit": "kits",
        "total_quantity": 50,
        "available_quantity": 50,
        "location_name": "Test Medical Depot"
    }
    res_resp = client.post("/api/resources/", json=res_in, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_resp.status_code == 201
    res_id = res_resp.json()["id"]

    # Run AI Recommendation
    rec_resp = client.post("/api/resources/ai-recommendation", params={
        "emergency_type": "medical_emergency",
        "people_affected": 10,
        "injured_persons": 3,
        "medical_required": True,
        "severity": "HIGH"
    })
    assert rec_resp.status_code == 200
    recommendations = rec_resp.json()["recommendations"]
    assert len(recommendations) > 0

    # Allocate within available bounds
    alloc_payload = {
        "emergency_id": 1,
        "resource_id": res_id,
        "allocated_quantity": 10,
        "notes": "Dispatch for emergency triage"
    }
    alloc_resp = client.post("/api/resources/allocate", json=alloc_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert alloc_resp.status_code == 201
    assert alloc_resp.json()["allocated_quantity"] == 10

    # Test rejection when allocating beyond available stock
    excessive_alloc = {
        "emergency_id": 1,
        "resource_id": res_id,
        "allocated_quantity": 100, # More than remaining 40
        "notes": "Excessive request"
    }
    fail_resp = client.post("/api/resources/allocate", json=excessive_alloc, headers={"Authorization": f"Bearer {admin_token}"})
    assert fail_resp.status_code == 400
    assert "Cannot allocate" in fail_resp.json()["detail"]

def test_shelter_capacity_and_overflow_prevention(client):
    admin_token = get_auth_token(client, "testadmin", "Admin@123")

    # Create Shelter
    shelter_in = {
        "name": "Test Primary School Camp",
        "address": "Kowdiar, Thiruvananthapuram",
        "latitude": 8.5200,
        "longitude": 76.9600,
        "capacity": 100,
        "occupied": 80,
        "has_medical_facility": True,
        "has_food": True,
        "has_water": True,
        "has_electricity": True,
        "is_accessible": True
    }
    s_resp = client.post("/api/shelters/", json=shelter_in, headers={"Authorization": f"Bearer {admin_token}"})
    assert s_resp.status_code == 201
    shelter_id = s_resp.json()["id"]
    assert s_resp.json()["available_capacity"] == 20

    # Add 15 occupants (allowed)
    occ_resp = client.patch(f"/api/shelters/{shelter_id}/occupancy", json={"change_count": 15}, headers={"Authorization": f"Bearer {admin_token}"})
    assert occ_resp.status_code == 200
    assert occ_resp.json()["occupied"] == 95
    assert occ_resp.json()["available_capacity"] == 5

    # Attempt to add 10 more (exceeds capacity of 100) -> Must fail
    overflow_resp = client.patch(f"/api/shelters/{shelter_id}/occupancy", json={"change_count": 10}, headers={"Authorization": f"Bearer {admin_token}"})
    assert overflow_resp.status_code == 400
    assert "Shelter capacity exceeded" in overflow_resp.json()["detail"]

def test_ai_volunteer_matching(client):
    # Register volunteer with medical skills
    vol_in = {
        "name": "Dr. Vivek Sharma",
        "email": "vivek.sharma@example.com",
        "phone": "+91 98950 12345",
        "skills": ["medical", "first_aid"],
        "latitude": 8.5250,
        "longitude": 76.9400,
        "address": "Vellayambalam",
        "availability": "AVAILABLE"
    }
    client.post("/api/volunteers/", json=vol_in)

    # Match for medical needs at nearby location
    match_resp = client.post("/api/volunteers/ai-match", params={
        "lat": 8.5240,
        "lon": 76.9390,
        "required_skills": ["medical", "first_aid"]
    })
    assert match_resp.status_code == 200
    matched = match_resp.json()["matched_volunteers"]
    assert len(matched) > 0
    top_match = matched[0]
    assert top_match["match_score"] > 60.0
    assert "medical" in top_match["matching_skills"]

def test_offline_sync_idempotency(client):
    # Batch with client_id
    batch = {
        "emergencies": [
            {
                "client_id": "offline-client-uuid-001",
                "emergency_type": "flood_evac",
                "description": "Water rising around house.",
                "latitude": 8.5000,
                "longitude": 76.9400,
                "address": "Karamana",
                "people_affected": 3
            },
            {
                "client_id": "offline-client-uuid-002",
                "emergency_type": "tree_fall",
                "description": "Tree fell across driveway.",
                "latitude": 8.5100,
                "longitude": 76.9500,
                "address": "Pattom",
                "people_affected": 2
            }
        ]
    }

    # First sync -> both should be created
    resp1 = client.post("/api/emergencies/sync-offline", json=batch)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["synced"] == 2
    assert data1["duplicates_skipped"] == 0

    # Second sync of identical batch -> both should be skipped idempotently
    resp2 = client.post("/api/emergencies/sync-offline", json=batch)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["synced"] == 0
    assert data2["duplicates_skipped"] == 2

def test_evidence_file_upload(client):
    admin_token = get_auth_token(client, "testadmin", "Admin@123")

    # Create dummy image file
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00")
    files = {"file": ("resolution_proof.jpg", fake_image, "image/jpeg")}
    data = {"description": "Water receded and residents safely evacuated", "resolution_notes": "All 4 residents transferred to camp"}

    resp = client.post("/api/evidence/upload/1", files=files, data=data, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 201
    assert resp.json()["file_name"] == "resolution_proof.jpg"
    assert resp.json()["emergency_id"] == 1

def test_operational_map_and_analytics_endpoints(client):
    # Map Overview
    map_resp = client.get("/api/map/overview")
    assert map_resp.status_code == 200
    map_data = map_resp.json()
    assert "emergencies" in map_data
    assert "rescue_teams" in map_data
    assert "shelters" in map_data
    assert "resources" in map_data

    # Analytics Overview
    analytics_resp = client.get("/api/analytics/overview")
    assert analytics_resp.status_code == 200
    a_data = analytics_resp.json()
    assert a_data["total_emergencies"] >= 0
    assert "emergencies_by_severity" in a_data
    assert "shelter_occupancy_rate_pct" in a_data
