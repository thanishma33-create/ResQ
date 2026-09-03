import pytest
import datetime
from fastapi.testclient import TestClient
from services.location_service import (
    calculate_distance,
    calculate_distance_km,
    get_bounding_box
)
import models
from tests.conftest import TestingSessionLocal
from auth import create_access_token

def test_haversine_distance_accuracy_and_alias():
    """Test standard Haversine distance calculation and explicit calculate_distance_km alias."""
    # Trivandrum Center (8.5241, 76.9366) to Kazhakkoottam (8.5686, 76.8731) ~8.5-9.0 km
    dist1 = calculate_distance(8.5241, 76.9366, 8.5686, 76.8731)
    dist2 = calculate_distance_km(8.5241, 76.9366, 8.5686, 76.8731)
    assert 8.0 <= dist1 <= 10.0
    assert dist1 == dist2

    # Kochi (9.9312, 76.2673) to Trivandrum (8.5241, 76.9366) ~180-200 km
    dist_kochi_tvm = calculate_distance_km(9.9312, 76.2673, 8.5241, 76.9366)
    assert 170.0 <= dist_kochi_tvm <= 210.0

    # Same coordinates should be exactly 0.0 km
    assert calculate_distance(9.9312, 76.2673, 9.9312, 76.2673) == 0.0


def test_bounding_box_computation():
    """Test bounding box calculation around coordinates."""
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(9.9312, 76.2673, 5.0)
    assert lat_min < 9.9312 < lat_max
    assert lon_min < 76.2673 < lon_max


def test_kochi_location_nearby_assistance(client: TestClient):
    """Test GET /locations/nearby for Kochi coordinates (9.9312, 76.2673)."""
    response = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    assert response.status_code == 200
    data = response.json()
    assert data["user_location"]["latitude"] == 9.9312
    assert data["user_location"]["longitude"] == 76.2673
    assert data["radius_km"] == 5.0
    assert "resources" in data
    assert "shelters" in data
    assert "rescue_teams" in data
    assert "generated_at" in data or "timestamp" in data

    # All returned resources must be within 5km of Kochi
    for r in data["resources"]:
        assert r["distance_km"] <= 5.0
        assert r["latitude"] is not None
        assert r["longitude"] is not None


def test_kollam_location_nearby_assistance(client: TestClient):
    """Test GET /locations/nearby for Kollam coordinates (8.8932, 76.6141)."""
    response = client.get("/locations/nearby?latitude=8.8932&longitude=76.6141&radius_km=5")
    assert response.status_code == 200
    data = response.json()
    assert data["user_location"]["latitude"] == 8.8932
    assert data["user_location"]["longitude"] == 76.6141
    assert data["radius_km"] == 5.0

    for s in data["shelters"]:
        assert s["distance_km"] <= 5.0


def test_trivandrum_location_nearby_assistance(client: TestClient):
    """Test GET /locations/nearby for Trivandrum coordinates (8.5241, 76.9366)."""
    response = client.get("/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=5")
    assert response.status_code == 200
    data = response.json()
    assert data["user_location"]["latitude"] == 8.5241
    assert data["user_location"]["longitude"] == 76.9366
    assert data["radius_km"] == 5.0


def test_different_coordinates_produce_different_nearby_results(client: TestClient):
    """Verify that querying Kochi vs Kollam vs Trivandrum produces distinct geographic results."""
    res_kochi = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5").json()
    res_kollam = client.get("/locations/nearby?latitude=8.8932&longitude=76.6141&radius_km=5").json()
    res_tvm = client.get("/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=5").json()

    # User locations must differ
    assert res_kochi["user_location"]["latitude"] == 9.9312
    assert res_kollam["user_location"]["latitude"] == 8.8932
    assert res_tvm["user_location"]["latitude"] == 8.5241

    kochi_resource_ids = {r["id"] for r in res_kochi["resources"]}
    tvm_resource_ids = {r["id"] for r in res_tvm["resources"]}

    # Kochi and Trivandrum are ~200km apart; in a 5km radius, they should not return the same resources
    if kochi_resource_ids and tvm_resource_ids:
        assert kochi_resource_ids.isdisjoint(tvm_resource_ids)


def test_radius_parameters(client: TestClient):
    """Test different radius values: 1 km, 5 km, 10 km."""
    for r in [1.0, 5.0, 10.0]:
        res = client.get(f"/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km={r}")
        assert res.status_code == 200
        assert res.json()["radius_km"] == r


def test_both_endpoints_work_identically(client: TestClient):
    """Test both GET /locations/nearby and GET /api/locations/nearby."""
    res1 = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    res2 = client.get("/api/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["user_location"] == res2.json()["user_location"]


def test_invalid_coordinates(client: TestClient):
    """Test that invalid latitudes and longitudes return HTTP 422."""
    res1 = client.get("/locations/nearby?latitude=95.0&longitude=76.9366")
    assert res1.status_code == 422

    res2 = client.get("/locations/nearby?latitude=-95.0&longitude=76.9366")
    assert res2.status_code == 422

    res3 = client.get("/locations/nearby?latitude=8.5241&longitude=190.0")
    assert res3.status_code == 422

    res4 = client.get("/locations/nearby?latitude=8.5241&longitude=-190.0")
    assert res4.status_code == 422


def test_negative_accuracy_validation(client: TestClient):
    """Test that negative GPS accuracy returns HTTP 422."""
    res = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&accuracy=-5.0")
    assert res.status_code == 422


def test_valid_accuracy_inclusion(client: TestClient):
    """Test that non-negative accuracy is preserved in user_location."""
    res = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&accuracy=15.5")
    assert res.status_code == 200
    data = res.json()
    assert data["user_location"]["accuracy_m"] == 15.5


def test_missing_coordinates_returns_422(client: TestClient):
    """Test that omitting latitude or longitude returns HTTP 422 without fallback."""
    res = client.get("/locations/nearby")
    assert res.status_code == 422

    res_no_lon = client.get("/locations/nearby?latitude=9.9312")
    assert res_no_lon.status_code == 422


def test_zero_stock_resource_exclusion(client: TestClient):
    """Test that depleted/zero-stock resources are excluded from available list."""
    db = TestingSessionLocal()
    r_avail = models.Resource(
        name="Available Test Water",
        category="water",
        total_quantity=500,
        available_quantity=200,
        unit="liters",
        latitude=9.9315,
        longitude=76.2675,
        location_name="Kochi Test Depot"
    )
    r_zero = models.Resource(
        name="Depleted Test Blankets",
        category="blankets",
        total_quantity=100,
        available_quantity=0,
        unit="pieces",
        latitude=9.9315,
        longitude=76.2675,
        location_name="Kochi Test Depot"
    )
    db.add_all([r_avail, r_zero])
    db.commit()
    db.close()

    res = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    assert res.status_code == 200
    resources = res.json()["resources"]
    names = [r["name"] for r in resources]
    assert "Available Test Water" in names
    assert "Depleted Test Blankets" not in names


def test_full_shelter_handling_citizen_vs_privileged(client: TestClient):
    """Test that full shelters are excluded from public citizen queries but visible to privileged operators."""
    db = TestingSessionLocal()
    s_open = models.Shelter(
        name="Open Test Camp Kochi",
        address="Marine Drive",
        latitude=9.9320,
        longitude=76.2680,
        capacity=100,
        occupied=40,
        available_capacity=60,
        status="OPEN"
    )
    s_full = models.Shelter(
        name="Full Test Camp Kochi",
        address="Marine Drive",
        latitude=9.9320,
        longitude=76.2680,
        capacity=100,
        occupied=100,
        available_capacity=0,
        status="FULL"
    )
    db.add_all([s_open, s_full])
    db.commit()
    db.close()

    # 1. Anonymous / Citizen request
    res_citizen = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    assert res_citizen.status_code == 200
    shelters_citizen = res_citizen.json()["shelters"]
    names_citizen = [s["name"] for s in shelters_citizen]
    assert "Open Test Camp Kochi" in names_citizen
    assert "Full Test Camp Kochi" not in names_citizen

    # 2. Privileged Operator request
    op_token = create_access_token(data={"sub": "testoperator", "role": "operator"})
    res_op = client.get(
        "/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5",
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert res_op.status_code == 200
    shelters_op = res_op.json()["shelters"]
    names_op = [s["name"] for s in shelters_op]
    assert "Open Test Camp Kochi" in names_op
    assert "Full Test Camp Kochi" in names_op


def test_nearest_first_sorting(client: TestClient):
    """Test that results are sorted in ascending order of distance."""
    res = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=10")
    assert res.status_code == 200
    data = res.json()

    # Check resources sorting
    r_dists = [r["distance_km"] for r in data["resources"]]
    assert r_dists == sorted(r_dists)

    # Check shelters sorting
    s_dists = [s["distance_km"] for s in data["shelters"]]
    assert s_dists == sorted(s_dists)


def test_rescue_team_fields_and_availability_sorting(client: TestClient):
    """Test rescue team fields and that AVAILABLE teams are prioritized."""
    db = TestingSessionLocal()
    t_avail = models.RescueTeam(
        name="Kochi Alpha Rescue",
        team_leader="Capt. Alpha",
        contact_phone="+91 99999 11111",
        specialty="boat_rescue",
        latitude=9.9350,
        longitude=76.2690,
        base_location="Kochi Base",
        status="AVAILABLE"
    )
    t_busy = models.RescueTeam(
        name="Kochi Beta Rescue (Closer but Busy)",
        team_leader="Capt. Beta",
        contact_phone="+91 99999 22222",
        specialty="search_rescue",
        latitude=9.9315,  # Closer to 9.9312
        longitude=76.2675,
        base_location="Kochi Base",
        status="BUSY"
    )
    db.add_all([t_avail, t_busy])
    db.commit()
    db.close()

    res = client.get("/locations/nearby?latitude=9.9312&longitude=76.2673&radius_km=5")
    assert res.status_code == 200
    teams = res.json()["rescue_teams"]
    assert len(teams) > 0

    # First team should have status AVAILABLE
    assert teams[0]["status"] == "AVAILABLE"
    assert teams[0]["availability"] == "AVAILABLE"
    assert "skills" in teams[0]
    assert "equipment" in teams[0]


def test_sos_stores_actual_coordinates(client: TestClient):
    """Test that SOS stores the actual submitted coordinates without defaulting to Trivandrum."""
    payload = {
        "name": "Kochi Distress Reporter",
        "phone": "+91 98765 33333",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "gps_accuracy": 8.0,
        "people": 2,
        "message": "Water rising near Kochi Marine Drive"
    }
    res = client.post("/api/sos/", json=payload)
    assert res.status_code == 201
    emergency_id = res.json()["emergency_id"]

    db = TestingSessionLocal()
    em = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    assert em is not None
    assert em.latitude == 9.9312
    assert em.longitude == 76.2673
    assert em.gps_accuracy == 8.0
    db.close()


def test_offline_sos_preserves_device_coordinates(client: TestClient):
    """Test that offline batch sync preserves exact device coordinates."""
    client_id = f"SOS-OFFLINE-KOCHI-{datetime.datetime.now(datetime.timezone.utc).timestamp()}"
    batch = {
        "items": [
            {
                "client_sos_id": client_id,
                "name": "Kollam Offline Victim",
                "phone": "+91 98765 44444",
                "latitude": 8.8932,
                "longitude": 76.6141,
                "gps_accuracy": 12.0,
                "people": 1,
                "message": "Offline SOS from Kollam",
                "client_created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        ]
    }
    res = client.post("/api/sos/sync", json=batch)
    assert res.status_code == 200
    assert res.json()["synced_count"] == 1

    db = TestingSessionLocal()
    em = db.query(models.Emergency).filter(models.Emergency.client_sos_id == client_id).first()
    assert em is not None
    assert em.latitude == 8.8932
    assert em.longitude == 76.6141
    db.close()
