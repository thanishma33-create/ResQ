from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.weather_service import get_simulated_weather_report, generate_weather_alerts_if_needed
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/weather", tags=["Disaster & Weather Alerts"])

@router.get("/current", response_model=dict)
def get_current_weather(
    location_name: Optional[str] = Query(None, description="Kerala station name (e.g. Thiruvananthapuram City, Nedumangad, Ponmudi)"),
    lat: Optional[float] = None,
    lon: Optional[float] = None
):
    """
    Get meteorological observation, precipitation, and flood/landslide risk assessment.
    Simulated data for Kerala region with pluggable live API architecture.
    """
    return get_simulated_weather_report(location_name=location_name, lat=lat, lon=lon)


@router.get("/alerts", response_model=List[schemas.WeatherAlertOut])
def get_weather_alerts(db: Session = Depends(get_db)):
    """List active weather and disaster alerts across stations."""
    alerts = generate_weather_alerts_if_needed(db)
    return alerts


@router.post("/alerts", response_model=schemas.WeatherAlertOut, status_code=status.HTTP_201_CREATED)
async def create_custom_weather_alert(
    alert_in: schemas.WeatherAlertCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Issue an official meteorological / disaster hazard alert."""
    alert = models.WeatherAlert(
        location_name=alert_in.location_name,
        latitude=alert_in.latitude,
        longitude=alert_in.longitude,
        weather_condition=alert_in.weather_condition,
        temperature=alert_in.temperature,
        rainfall_mm=alert_in.rainfall_mm,
        wind_speed_kmh=alert_in.wind_speed_kmh,
        flood_risk=alert_in.flood_risk.upper(),
        landslide_risk=alert_in.landslide_risk.upper(),
        cyclone_risk=alert_in.cyclone_risk.upper(),
        alert_level=alert_in.alert_level.upper(),
        description=alert_in.description,
        is_simulated=alert_in.is_simulated,
        expires_at=alert_in.expires_at
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Real-Time WebSocket broadcast
    await manager.broadcast("WEATHER_ALERT", {
        "alert_id": alert.id,
        "location": alert.location_name,
        "level": alert.alert_level,
        "flood_risk": alert.flood_risk,
        "landslide_risk": alert.landslide_risk,
        "description": alert.description
    })

    return alert


@router.get("/risk-assessment", response_model=dict)
def assess_location_risk(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Computes instant multi-hazard risk assessment based on geospatial coordinates."""
    report = get_simulated_weather_report(lat=lat, lon=lon)
    return {
        "latitude": lat,
        "longitude": lon,
        "flood_risk": report["flood_risk"],
        "landslide_risk": report["landslide_risk"],
        "cyclone_risk": report["cyclone_risk"],
        "rainfall_24h_mm": report["rainfall_mm"],
        "alert_level": report["alert_level"],
        "is_simulated": True
    }
