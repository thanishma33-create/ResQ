from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_optional_current_user
from services.location_service import get_nearby_assistance, validate_coordinates

router = APIRouter(prefix="/api/locations", tags=["Nearby Assistance & Location Intelligence"])

@router.get("/nearby", response_model=schemas.NearbyLocationResponse)
def get_nearby_assistance_endpoint(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User current latitude (-90 to +90)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User current longitude (-180 to +180)"),
    radius_km: Optional[float] = Query(None, ge=0.1, le=50.0, description="Search radius in km (options: 1, 3, 5, 10, 25, default 5)"),
    radius: Optional[float] = Query(None, ge=0.1, le=50.0, description="Search radius in km alias"),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Authoritative Proximity Search for Current Location.
    Finds available resources, relief shelters, rescue squads, and nearby incidents within `radius_km` (default: 5.0 km).
    Computes exact Haversine distances, excludes depleted stocks, and provides explainable AI recommendations.
    """
    try:
        validate_coordinates(latitude, longitude)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    effective_radius = radius_km if radius_km is not None else (radius if radius is not None else 5.0)

    return get_nearby_assistance(
        db=db,
        lat=latitude,
        lon=longitude,
        radius_km=effective_radius,
        current_user=current_user
    )
