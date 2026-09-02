import math
import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

import models
import schemas

EARTH_RADIUS_KM = 6371.0

def validate_coordinates(lat: float, lon: float):
    """Validates geographic coordinate bounds."""
    if lat is None or not (-90.0 <= float(lat) <= 90.0):
        raise ValueError(f"Invalid latitude {lat}. Latitude must be between -90 and 90 degrees.")
    if lon is None or not (-180.0 <= float(lon) <= 180.0):
        raise ValueError(f"Invalid longitude {lon}. Longitude must be between -180 and 180 degrees.")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Authoritative Haversine formula calculation for distance between two points in kilometers.
    """
    validate_coordinates(lat1, lon1)
    validate_coordinates(lat2, lon2)

    # Convert degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formulation
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_KM * c

    return round(distance, 2)


def get_bounding_box(lat: float, lon: float, radius_km: float) -> Tuple[float, float, float, float]:
    """
    Calculates latitude and longitude bounding box for efficient database pre-filtering.
    """
    lat_delta = radius_km / 111.0
    lon_scale = math.cos(math.radians(lat))
    lon_delta = radius_km / (111.0 * max(0.01, abs(lon_scale)))

    lat_min = max(-90.0, lat - lat_delta)
    lat_max = min(90.0, lat + lat_delta)
    lon_min = max(-180.0, lon - lon_delta)
    lon_max = min(180.0, lon + lon_delta)

    return (lat_min, lat_max, lon_min, lon_max)


def get_nearby_resources(
    db: Session,
    lat: float,
    lon: float,
    radius_km: float = 5.0,
    exclude_zero_stock: bool = True
) -> List[schemas.NearbyResource]:
    """
    Searches available emergency resources within the requested radius.
    Excludes depleted resources with zero available quantity.
    """
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(lat, lon, radius_km)

    query = db.query(models.Resource).filter(
        models.Resource.latitude.isnot(None),
        models.Resource.longitude.isnot(None),
        models.Resource.latitude.between(lat_min, lat_max),
        models.Resource.longitude.between(lon_min, lon_max)
    )

    if exclude_zero_stock:
        query = query.filter(models.Resource.available_quantity > 0)

    resources = query.all()
    results: List[schemas.NearbyResource] = []

    for r in resources:
        dist = calculate_distance(lat, lon, r.latitude, r.longitude)
        if dist <= radius_km:
            avail_status = "AVAILABLE" if r.available_quantity > 0 else "DEPLETED"
            results.append(
                schemas.NearbyResource(
                    id=r.id,
                    name=r.name,
                    type=r.category,
                    available_quantity=r.available_quantity,
                    total_quantity=r.total_quantity,
                    unit=r.unit,
                    latitude=r.latitude,
                    longitude=r.longitude,
                    distance_km=dist,
                    availability_status=avail_status,
                    location_name=r.location_name,
                    last_updated=r.updated_at or r.created_at,
                    eta_minutes=None  # No fake ETA
                )
            )

    results.sort(key=lambda item: item.distance_km)
    return results


def get_nearby_shelters(
    db: Session,
    lat: float,
    lon: float,
    radius_km: float = 5.0,
    is_privileged: bool = False
) -> List[schemas.NearbyShelter]:
    """
    Searches relief shelters within radius.
    Calculates available_capacity = total_capacity - occupied_capacity.
    Excludes full shelters for citizens unless privileged operator/admin.
    """
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(lat, lon, radius_km)

    query = db.query(models.Shelter).filter(
        models.Shelter.latitude.isnot(None),
        models.Shelter.longitude.isnot(None),
        models.Shelter.latitude.between(lat_min, lat_max),
        models.Shelter.longitude.between(lon_min, lon_max)
    )

    shelters = query.all()
    results: List[schemas.NearbyShelter] = []

    for s in shelters:
        dist = calculate_distance(lat, lon, s.latitude, s.longitude)
        if dist <= radius_km:
            total_cap = s.capacity or 0
            occupied = s.occupied or 0
            available_cap = max(0, total_cap - occupied)
            status = "FULL" if available_cap <= 0 else (s.status or "OPEN")

            if not is_privileged and (available_cap <= 0 or status == "FULL"):
                continue

            results.append(
                schemas.NearbyShelter(
                    id=s.id,
                    name=s.name,
                    latitude=s.latitude,
                    longitude=s.longitude,
                    distance_km=dist,
                    total_capacity=total_cap,
                    occupied_capacity=occupied,
                    available_capacity=available_cap,
                    status=status,
                    address=s.address,
                    contact_phone=s.contact_phone,
                    has_medical=bool(s.has_medical_facility),
                    has_food=bool(s.has_food),
                    last_updated=s.updated_at or s.created_at,
                    eta_minutes=None  # No fake ETA
                )
            )

    results.sort(key=lambda item: item.distance_km)
    return results


def get_nearby_rescue_teams(
    db: Session,
    lat: float,
    lon: float,
    radius_km: float = 5.0,
    is_privileged: bool = False
) -> List[schemas.NearbyRescueTeam]:
    """
    Searches rescue squads within radius.
    Prioritizes AVAILABLE teams and sorts nearest first.
    Filters out sensitive operational notes for unauthenticated/citizen requests.
    """
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(lat, lon, radius_km)

    query = db.query(models.RescueTeam).filter(
        models.RescueTeam.latitude.isnot(None),
        models.RescueTeam.longitude.isnot(None),
        models.RescueTeam.latitude.between(lat_min, lat_max),
        models.RescueTeam.longitude.between(lon_min, lon_max)
    )

    teams = query.all()
    results: List[schemas.NearbyRescueTeam] = []

    for t in teams:
        dist = calculate_distance(lat, lon, t.latitude, t.longitude)
        if dist <= radius_km:
            skills = [s.strip() for s in t.specialty.split(",")] if t.specialty else ["General Rescue"]
            equipment = ["Rescue Boat", "Life Jackets", "First Aid"] if "flood" in (t.specialty or "").lower() else ["Extraction Gear", "First Aid"]
            
            # Hide sensitive team leader private contacts for unauthenticated queries
            contact = t.contact_phone if (is_privileged or t.status == "AVAILABLE") else "Disaster Helpline (1077)"

            results.append(
                schemas.NearbyRescueTeam(
                    id=t.id,
                    name=t.name,
                    team_leader=t.team_leader if is_privileged else t.name,
                    contact_phone=contact,
                    specialty=t.specialty,
                    status=t.status,
                    members_count=t.max_capacity or 6,
                    skills=skills,
                    equipment=equipment,
                    latitude=t.latitude,
                    longitude=t.longitude,
                    distance_km=dist,
                    last_updated=t.updated_at or t.created_at,
                    eta_minutes=None  # No fake ETA
                )
            )

    # Sort: AVAILABLE first, then by distance_km
    results.sort(key=lambda item: (0 if item.status == "AVAILABLE" else 1, item.distance_km))
    return results


def get_nearby_assistance(
    db: Session,
    lat: float,
    lon: float,
    radius_km: float = 5.0,
    current_user: Optional[models.User] = None
) -> schemas.NearbyLocationResponse:
    """
    Assembles comprehensive Nearby Assistance response for the user's current GPS location.
    Integrates explainable AI recommendations.
    """
    validate_coordinates(lat, lon)
    is_privileged = current_user is not None and getattr(current_user, 'role', '') in ['admin', 'operator']

    resources = get_nearby_resources(db, lat, lon, radius_km=radius_km, exclude_zero_stock=True)
    shelters = get_nearby_shelters(db, lat, lon, radius_km=radius_km, is_privileged=is_privileged)
    rescue_teams = get_nearby_rescue_teams(db, lat, lon, radius_km=radius_km, is_privileged=is_privileged)

    # Emergencies (for situational intelligence)
    lat_min, lat_max, lon_min, lon_max = get_bounding_box(lat, lon, radius_km)
    emergencies_query = db.query(models.Emergency).filter(
        models.Emergency.latitude.isnot(None),
        models.Emergency.longitude.isnot(None),
        models.Emergency.status != "CANCELLED",
        models.Emergency.latitude.between(lat_min, lat_max),
        models.Emergency.longitude.between(lon_min, lon_max)
    )
    emergencies = []
    for e in emergencies_query.all():
        dist = calculate_distance(lat, lon, e.latitude, e.longitude)
        if dist <= radius_km:
            emergencies.append(
                schemas.NearbyEmergency(
                    id=e.id,
                    emergency_type=e.emergency_type,
                    severity=e.severity,
                    status=e.status,
                    address=e.address if is_privileged else f"Proximity ({round(dist, 1)} km)",
                    people_affected=e.people_affected,
                    distance_km=dist,
                    latitude=e.latitude,
                    longitude=e.longitude,
                    created_at=e.created_at,
                    eta_minutes=None
                )
            )
    emergencies.sort(key=lambda item: item.distance_km)

    # AI Explainable Recommendations
    ai_recs = None
    rec_team = None
    rec_shelter = None
    rec_resource = None

    # Top Team Recommendation
    available_teams = [t for t in rescue_teams if t.status == "AVAILABLE"]
    if available_teams:
        top_t = available_teams[0]
        rec_team = schemas.AIRecommendedTeam(
            id=top_t.id,
            name=top_t.name,
            distance_km=top_t.distance_km,
            availability=top_t.status,
            reasons=[
                f"Closest active rescue squad within {top_t.distance_km} km",
                f"Unit status: {top_t.status} with {top_t.members_count} active responders",
                f"Specialization: {top_t.specialty}"
            ]
        )

    # Top Shelter Recommendation
    open_shelters = [s for s in shelters if s.available_capacity > 0 and s.status != "FULL"]
    if open_shelters:
        top_s = open_shelters[0]
        rec_shelter = schemas.AIRecommendedShelter(
            id=top_s.id,
            name=top_s.name,
            distance_km=top_s.distance_km,
            available_capacity=top_s.available_capacity,
            has_medical=top_s.has_medical,
            reasons=[
                f"Nearest open relief camp at {top_s.distance_km} km",
                f"Sufficient free bed space: {top_s.available_capacity} beds available",
                "Medical aid station available on site" if top_s.has_medical else "Emergency shelter and relief rations active"
            ]
        )

    # Top Resource Recommendation
    if resources:
        top_r = resources[0]
        rec_resource = schemas.AIRecommendedResource(
            id=top_r.id,
            name=top_r.name,
            type=top_r.type,
            available_quantity=top_r.available_quantity,
            distance_km=top_r.distance_km,
            reasons=[
                f"Nearest available emergency supply depot at {top_r.distance_km} km",
                f"In-stock quantity: {top_r.available_quantity} {top_r.unit}",
                f"Location: {top_r.location_name or 'Central Depot'}"
            ]
        )

    if rec_team or rec_shelter or rec_resource:
        ai_recs = schemas.NearbyAIRecommendations(
            recommended_team=rec_team,
            recommended_shelter=rec_shelter,
            recommended_resource=rec_resource
        )

    now = datetime.datetime.now(datetime.timezone.utc)

    return schemas.NearbyLocationResponse(
        user_location={"latitude": lat, "longitude": lon},
        radius_km=radius_km,
        resources=resources,
        shelters=shelters,
        rescue_teams=rescue_teams,
        emergencies=emergencies,
        ai_recommendations=ai_recs,
        timestamp=now,
        last_updated=now
    )
