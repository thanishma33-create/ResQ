import pytest
from fastapi.testclient import TestClient
from services.location_service import calculate_distance, get_bounding_box
import models
from tests.conftest import TestingSessionLocal

def test_haversine_distance_accuracy():
    """Test standard Haversine distance calculation."""
    # Trivandrum Center (8.5241, 76.9366) to Kazhakkoottam (8.5686, 76.8731) ~8.5-9.0 km
    dist = calculate_distance(8.5241, 76.9366, 8.5686, 76.8731)
    assert 8.0 <= dist <= 10.0

    # Same coordinates should be 0.0 km
    assert calculate_distance(8.5241, 76.9366, 8.5241, 76.9366) == 0.0


def test_bounding_box_computation():
    """Test bounding box calculation around coordinates."""
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(8.5241, 76.9366, 5.0)
    assert lat_min < 8.5241 < lat_max
    assert lon_min < 76.9366 < lon_max


def test_valid_nearby_query_default_radius(client: TestClient):
    """Test GET /api/locations/nearby with default 5 km radius."""
    response = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366")
    assert response.status_code == 200
    data = response.json()
    assert data["user_location"]["latitude"] == 8.5241
    assert data["user_location"]["longitude"] == 76.9366
    assert data["radius_km"] == 5.0
    assert "resources" in data
    assert "shelters" in data
    assert "rescue_teams" in data
    assert "timestamp" in data


def test_radius_parameters(client: TestClient):
    """Test different radius values: 1 km, 10 km, 25 km."""
    for r in [1.0, 10.0, 25.0]:
        res = client.get(f"/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km={r}")
        assert res.status_code == 200
        assert res.json()["radius_km"] == r


def test_invalid_coordinates(client: TestClient):
    """Test that invalid latitudes and longitudes return 422."""
    res1 = client.get("/api/locations/nearby?latitude=95.0&longitude=76.9366")
    assert res1.status_code == 422

    res2 = client.get("/api/locations/nearby?latitude=-95.0&longitude=76.9366")
    assert res2.status_code == 422

    res3 = client.get("/api/locations/nearby?latitude=8.5241&longitude=190.0")
    assert res3.status_code == 422

    res4 = client.get("/api/locations/nearby?latitude=8.5241&longitude=-190.0")
    assert res4.status_code == 422


def test_zero_stock_resource_exclusion(client: TestClient):
    """Test that depleted/zero-stock resources are excluded from available list."""
    db = TestingSessionLocal()
    # Create an available resource and a depleted resource
    r_avail = models.Resource(
        name="Available Water Bottles",
        category="water",
        total_quantity=500,
        available_quantity=200,
        unit="liters",
        latitude=8.5250,
        longitude=76.9370,
        location_name="Depot A"
    )
    r_zero = models.Resource(
        name="Depleted Blankets",
        category="blankets",
        total_quantity=100,
        available_quantity=0,
        unit="pieces",
        latitude=8.5250,
        longitude=76.9370,
        location_name="Depot B"
    )
    db.add_all([r_avail, r_zero])
    db.commit()
    db.close()

    res = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=5")
    assert res.status_code == 200
    resources = res.json()["resources"]
    names = [r["name"] for r in resources]
    assert "Available Water Bottles" in names
    assert "Depleted Blankets" not in names


def test_full_shelter_exclusion_for_citizens(client: TestClient):
    """Test that full shelters are excluded from public citizen recommendations."""
    db = TestingSessionLocal()
    s_open = models.Shelter(
        name="Open Test Camp",
        address="Kowdiar",
        latitude=8.5260,
        longitude=76.9380,
        capacity=100,
        occupied=40,
        available_capacity=60,
        status="OPEN"
    )
    s_full = models.Shelter(
        name="Full Test Camp",
        address="Pattom",
        latitude=8.5260,
        longitude=76.9380,
        capacity=100,
        occupied=100,
        available_capacity=0,
        status="FULL"
    )
    db.add_all([s_open, s_full])
    db.commit()
    db.close()

    # Anonymous / Citizen request
    res = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=5")
    assert res.status_code == 200
    shelters = res.json()["shelters"]
    names = [s["name"] for s in shelters]
    assert "Open Test Camp" in names
    assert "Full Test Camp" not in names


def test_nearest_first_sorting(client: TestClient):
    """Test that results are sorted in ascending order of distance."""
    res = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=10")
    assert res.status_code == 200
    data = res.json()

    # Check resources sorting
    r_dists = [r["distance_km"] for r in data["resources"]]
    assert r_dists == sorted(r_dists)

    # Check shelters sorting
    s_dists = [s["distance_km"] for s in data["shelters"]]
    assert s_dists == sorted(s_dists)


def test_no_fake_eta_returned(client: TestClient):
    """Test that without live routing integration, eta_minutes is null (Requirement 13)."""
    res = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=5")
    assert res.status_code == 200
    data = res.json()
    for r in data["resources"]:
        assert r["eta_minutes"] is None
    for s in data["shelters"]:
        assert s["eta_minutes"] is None
    for t in data["rescue_teams"]:
        assert t["eta_minutes"] is None


def test_ai_recommendations_structure(client: TestClient):
    """Test that explainable AI recommendations are returned with valid reasons."""
    res = client.get("/api/locations/nearby?latitude=8.5241&longitude=76.9366&radius_km=10")
    assert res.status_code == 200
    data = res.json()
    recs = data.get("ai_recommendations")
    if recs:
        if recs.get("recommended_team"):
            assert len(recs["recommended_team"]["reasons"]) > 0
            assert recs["recommended_team"]["distance_km"] >= 0.0
        if recs.get("recommended_shelter"):
            assert len(recs["recommended_shelter"]["reasons"]) > 0
            assert recs["recommended_shelter"]["available_capacity"] > 0
