from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.audit_service import log_audit
from utils.geo import sort_by_distance, estimate_eta_minutes
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/shelters", tags=["Shelter Operations & Capacity"])

@router.get("/", response_model=List[schemas.ShelterOut])
def list_shelters(
    has_space: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List disaster relief shelters and evacuation centers."""
    query = db.query(models.Shelter)
    if status:
        query = query.filter(models.Shelter.status == status.upper())
    if has_space is True:
        query = query.filter(models.Shelter.available_capacity > 0)

    return query.all()


@router.post("/", response_model=schemas.ShelterOut, status_code=status.HTTP_201_CREATED)
def create_shelter(
    shelter_in: schemas.ShelterCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Register a new relief shelter or relief camp."""
    if shelter_in.capacity <= 0:
        raise HTTPException(status_code=400, detail="Shelter capacity must be greater than 0")

    occupied = min(shelter_in.occupied, shelter_in.capacity)
    available = shelter_in.capacity - occupied

    shelter = models.Shelter(
        name=shelter_in.name,
        address=shelter_in.address,
        latitude=shelter_in.latitude,
        longitude=shelter_in.longitude,
        capacity=shelter_in.capacity,
        occupied=occupied,
        available_capacity=available,
        has_medical_facility=shelter_in.has_medical_facility,
        has_food=shelter_in.has_food,
        has_water=shelter_in.has_water,
        has_electricity=shelter_in.has_electricity,
        is_accessible=shelter_in.is_accessible,
        contact_person=shelter_in.contact_person,
        contact_phone=shelter_in.contact_phone,
        status="FULL" if available == 0 else "OPEN"
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)

    log_audit(
        db=db,
        action="CREATE",
        entity_type="Shelter",
        entity_id=str(shelter.id),
        user_id=current_user.id,
        username=current_user.username
    )

    return shelter


@router.get("/nearest", response_model=List[dict])
def find_nearest_shelters(
    lat: float = Query(..., description="Target Latitude"),
    lon: float = Query(..., description="Target Longitude"),
    require_space: bool = True,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Finds nearest relief shelters to coordinates with calculated travel ETA."""
    query = db.query(models.Shelter)
    if require_space:
        query = query.filter(models.Shelter.available_capacity > 0)

    shelters = query.all()
    sorted_shelters = sort_by_distance(lat, lon, shelters)

    results = []
    for shelter, dist_km in sorted_shelters[:limit]:
        eta = estimate_eta_minutes(dist_km, speed_kmh=40.0)
        results.append({
            "shelter": schemas.ShelterOut.model_validate(shelter),
            "distance_km": dist_km,
            "eta_minutes": eta
        })

    return results


@router.get("/{shelter_id}", response_model=schemas.ShelterOut)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    """Retrieve details and live capacity of a shelter."""
    shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return shelter


@router.put("/{shelter_id}", response_model=schemas.ShelterOut)
def update_shelter(
    shelter_id: int,
    shelter_in: schemas.ShelterUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Update shelter facility details and capabilities."""
    shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")

    fields = shelter_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if val is not None:
            setattr(shelter, field, val)

    # Recompute available capacity
    shelter.available_capacity = max(0, shelter.capacity - shelter.occupied)
    if shelter.available_capacity == 0 and shelter.status != "CLOSED":
        shelter.status = "FULL"

    db.commit()
    db.refresh(shelter)
    return shelter


@router.patch("/{shelter_id}/occupancy", response_model=schemas.ShelterOut)
async def update_shelter_occupancy(
    shelter_id: int,
    occupancy_in: schemas.ShelterOccupancyUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """
    Update occupant head count.
    Strictly validates capacity bounds (0 <= occupied <= capacity).
    Never permits over-capacity admissions.
    """
    shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")

    new_occupied = shelter.occupied + occupancy_in.change_count

    if new_occupied < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce occupants by {-occupancy_in.change_count}. Current occupants is {shelter.occupied}."
        )

    if new_occupied > shelter.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shelter capacity exceeded! Requested {new_occupied} occupants exceeds maximum capacity of {shelter.capacity} (Available: {shelter.available_capacity})."
        )

    old_occupied = shelter.occupied
    shelter.occupied = new_occupied
    shelter.available_capacity = shelter.capacity - new_occupied

    if shelter.available_capacity == 0:
        shelter.status = "FULL"
    elif shelter.status == "FULL":
        shelter.status = "OPEN"

    db.commit()
    db.refresh(shelter)

    log_audit(
        db=db,
        action="UPDATE_OCCUPANCY",
        entity_type="Shelter",
        entity_id=str(shelter.id),
        user_id=current_user.id,
        username=current_user.username,
        previous_state={"occupied": old_occupied},
        new_state={"occupied": new_occupied, "available_capacity": shelter.available_capacity}
    )

    await manager.broadcast("SHELTER_OCCUPANCY_CHANGED", {
        "shelter_id": shelter.id,
        "name": shelter.name,
        "occupied": shelter.occupied,
        "capacity": shelter.capacity,
        "available_capacity": shelter.available_capacity,
        "status": shelter.status
    })

    return shelter
