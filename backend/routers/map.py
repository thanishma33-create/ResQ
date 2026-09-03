from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from services.weather_service import generate_weather_alerts_if_needed

router = APIRouter(prefix="/api/map", tags=["Operational Map & Geospatial Layer"])

@router.get("/overview", response_model=schemas.MapOverviewOut)
def get_map_overview(db: Session = Depends(get_db)):
    """
    Consolidated Operational Map Layer.
    Aggregates active emergencies, rescue teams, shelters, resource depots,
    disaster zones, and weather hazards for unified GIS map rendering.
    """
    # 1. Emergencies
    emergencies = db.query(models.Emergency).filter(models.Emergency.status != "CANCELLED").all()
    e_markers = [
        schemas.MapMarker(
            id=f"emergency-{e.id}",
            entity_type="emergency",
            name=f"{e.emergency_type.replace('_', ' ').title()} - {e.address}",
            latitude=e.latitude,
            longitude=e.longitude,
            status=e.status,
            severity=e.severity,
            details={
                "emergency_id": e.id,
                "people_affected": e.people_affected,
                "priority_score": e.priority_score,
                "trapped": e.trapped,
                "medical_required": e.medical_required,
                "created_at": str(e.created_at)
            }
        ) for e in emergencies
    ]

    # 2. Rescue Teams
    teams = db.query(models.RescueTeam).all()
    t_markers = [
        schemas.MapMarker(
            id=f"team-{t.id}",
            entity_type="team",
            name=t.name,
            latitude=t.latitude,
            longitude=t.longitude,
            status=t.status,
            severity=None,
            details={
                "team_id": t.id,
                "team_leader": t.team_leader,
                "phone": t.contact_phone,
                "specialty": t.specialty,
                "base_location": t.base_location
            }
        ) for t in teams
    ]

    # 3. Shelters
    shelters = db.query(models.Shelter).all()
    s_markers = [
        schemas.MapMarker(
            id=f"shelter-{s.id}",
            entity_type="shelter",
            name=s.name,
            latitude=s.latitude,
            longitude=s.longitude,
            status=s.status,
            severity=None,
            details={
                "shelter_id": s.id,
                "capacity": s.capacity,
                "occupied": s.occupied,
                "available_capacity": s.available_capacity,
                "has_medical": s.has_medical_facility,
                "has_food": s.has_food,
                "contact_phone": s.contact_phone
            }
        ) for s in shelters
    ]

    # 4. Resources
    resources = db.query(models.Resource).all()
    r_markers = [
        schemas.MapMarker(
            id=f"resource-{r.id}",
            entity_type="resource",
            name=f"{r.name} ({r.location_name})",
            latitude=r.latitude,
            longitude=r.longitude,
            status="AVAILABLE" if r.available_quantity > 0 else "DEPLETED",
            severity=None,
            details={
                "resource_id": r.id,
                "category": r.category,
                "available_quantity": r.available_quantity,
                "unit": r.unit,
                "location": r.location_name
            }
        ) for r in resources if r.latitude is not None and r.longitude is not None
    ]

    # 5. Disasters
    disasters = db.query(models.DisasterEvent).filter(models.DisasterEvent.is_active == True).all()
    d_markers = [
        schemas.MapMarker(
            id=f"disaster-{d.id}",
            entity_type="disaster",
            name=f"{d.name} ({d.type.title()})",
            latitude=d.latitude,
            longitude=d.longitude,
            status="ACTIVE",
            severity=d.risk_level.upper(),
            details={
                "disaster_id": d.id,
                "type": d.type,
                "affected_area": d.affected_area,
                "risk_level": d.risk_level
            }
        ) for d in disasters
    ]

    # 6. Weather Alerts
    alerts = generate_weather_alerts_if_needed(db)
    weather_out = [schemas.WeatherAlertOut.model_validate(a) for a in alerts]

    return schemas.MapOverviewOut(
        emergencies=e_markers,
        rescue_teams=t_markers,
        shelters=s_markers,
        resources=r_markers,
        disasters=d_markers,
        weather_alerts=weather_out
    )

from routers.locations import get_nearby_assistance_endpoint
router.add_api_route("/nearby", get_nearby_assistance_endpoint, methods=["GET"], response_model=schemas.NearbyLocationResponse, summary="Nearby Assistance Query Alias")


