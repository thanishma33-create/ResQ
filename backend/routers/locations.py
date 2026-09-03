from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_optional_current_user
from services.location_service import get_nearby_assistance, validate_coordinates

router = APIRouter(tags=["Nearby Assistance & Location Intelligence"])

@router.get("/locations/nearby", response_model=schemas.NearbyLocationResponse, summary="Nearby Assistance Proximity Search")
@router.get("/api/locations/nearby", response_model=schemas.NearbyLocationResponse, summary="Nearby Assistance Proximity Search (API prefix)")
def get_nearby_assistance_endpoint(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User current GPS latitude (-90 to +90)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User current GPS longitude (-180 to +180)"),
    radius_km: Optional[float] = Query(None, ge=0.1, le=100.0, description="Search radius in km (default: 5.0)"),
    radius: Optional[float] = Query(None, ge=0.1, le=100.0, description="Search radius in km alias"),
    accuracy: Optional[float] = Query(None, description="GPS accuracy in meters (must be non-negative)"),
    accuracy_m: Optional[float] = Query(None, description="GPS accuracy in meters alias"),
    timestamp: Optional[str] = Query(None, description="Client GPS capture timestamp"),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Authoritative Proximity Search for Current Location.
    Finds available resources, relief shelters, rescue squads, and nearby incidents within `radius_km` (default: 5.0 km).
    Computes exact Haversine distances, excludes depleted stocks, and provides explainable AI recommendations.
    Never assumes a default or fixed city active zone.
    """
    try:
        validate_coordinates(latitude, longitude)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    effective_accuracy = accuracy if accuracy is not None else accuracy_m
    if effective_accuracy is not None and effective_accuracy < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid GPS accuracy {effective_accuracy}. Accuracy must be a non-negative number."
        )

    effective_radius = radius_km if radius_km is not None else (radius if radius is not None else 5.0)

    return get_nearby_assistance(
        db=db,
        lat=latitude,
        lon=longitude,
        radius_km=effective_radius,
        accuracy=effective_accuracy,
        current_user=current_user
    )

