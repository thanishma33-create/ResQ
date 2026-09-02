import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.audit_service import log_audit
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/disasters", tags=["Disaster Events Management"])

@router.get("/", response_model=List[schemas.DisasterEventOut])
def list_disasters(is_active: Optional[bool] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all disaster events with optional active status filter."""
    query = db.query(models.DisasterEvent)
    if is_active is not None:
        query = query.filter(models.DisasterEvent.is_active == is_active)
    return query.order_by(models.DisasterEvent.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.DisasterEventOut, status_code=status.HTTP_201_CREATED)
async def create_disaster(
    disaster_in: schemas.DisasterEventCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Declare a new disaster event (Flood, Cyclone, Landslide, Earthquake, Fire, etc.)."""
    disaster = models.DisasterEvent(
        name=disaster_in.name,
        type=disaster_in.type.lower(),
        description=disaster_in.description,
        affected_area=disaster_in.affected_area,
        latitude=disaster_in.latitude,
        longitude=disaster_in.longitude,
        risk_level=disaster_in.risk_level.lower(),
        start_time=disaster_in.start_time or datetime.datetime.utcnow(),
        end_time=disaster_in.end_time,
        is_active=disaster_in.is_active
    )
    db.add(disaster)
    db.commit()
    db.refresh(disaster)

    log_audit(
        db=db,
        action="CREATE",
        entity_type="DisasterEvent",
        entity_id=str(disaster.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state={"name": disaster.name, "type": disaster.type, "risk_level": disaster.risk_level}
    )

    await manager.broadcast("DISASTER_EVENT_DECLARED", {
        "id": disaster.id,
        "name": disaster.name,
        "type": disaster.type,
        "risk_level": disaster.risk_level,
        "affected_area": disaster.affected_area,
        "latitude": disaster.latitude,
        "longitude": disaster.longitude
    })

    return disaster


@router.get("/{disaster_id}", response_model=schemas.DisasterEventOut)
def get_disaster(disaster_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a specific disaster event."""
    disaster = db.query(models.DisasterEvent).filter(models.DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")
    return disaster


@router.put("/{disaster_id}", response_model=schemas.DisasterEventOut)
def update_disaster(
    disaster_id: int,
    disaster_in: schemas.DisasterEventUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Update disaster parameters, active status, or risk tier."""
    disaster = db.query(models.DisasterEvent).filter(models.DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")

    fields = disaster_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if val is not None:
            setattr(disaster, field, val)

    db.commit()
    db.refresh(disaster)

    log_audit(
        db=db,
        action="UPDATE",
        entity_type="DisasterEvent",
        entity_id=str(disaster.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state=fields
    )

    return disaster


@router.delete("/{disaster_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_disaster(
    disaster_id: int,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Deactivate or conclude an active disaster event."""
    disaster = db.query(models.DisasterEvent).filter(models.DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")

    disaster.is_active = False
    disaster.end_time = datetime.datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        action="DEACTIVATE",
        entity_type="DisasterEvent",
        entity_id=str(disaster.id),
        user_id=current_user.id,
        username=current_user.username
    )
    return None
