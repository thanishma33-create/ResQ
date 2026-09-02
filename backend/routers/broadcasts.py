import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.notification_service import create_notification
from services.audit_service import log_audit
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/broadcasts", tags=["Emergency Broadcasts"])

@router.get("/", response_model=List[schemas.EmergencyBroadcastOut])
def list_broadcasts(active_only: bool = True, db: Session = Depends(get_db)):
    """List public emergency broadcasts and warning bulletins."""
    query = db.query(models.EmergencyBroadcast)
    if active_only:
        query = query.filter(models.EmergencyBroadcast.is_active == True)

    return query.order_by(models.EmergencyBroadcast.created_at.desc()).all()


@router.post("/", response_model=schemas.EmergencyBroadcastOut, status_code=status.HTTP_201_CREATED)
async def create_broadcast(
    broadcast_in: schemas.EmergencyBroadcastCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Publish a high-priority public emergency broadcast with geofence."""
    broadcast = models.EmergencyBroadcast(
        title=broadcast_in.title,
        message=broadcast_in.message,
        severity=broadcast_in.severity.upper(),
        target_area=broadcast_in.target_area,
        latitude=broadcast_in.latitude,
        longitude=broadcast_in.longitude,
        radius_km=broadcast_in.radius_km,
        is_active=True,
        created_by_user_id=current_user.id,
        expires_at=broadcast_in.expires_at
    )
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    # Create system notification
    create_notification(
        db=db,
        title=f"📢 BROADCAST: {broadcast.title}",
        message=f"{broadcast.message} (Target: {broadcast.target_area})",
        notification_type="BROADCAST",
        severity=broadcast.severity,
        metadata={"broadcast_id": broadcast.id, "target_area": broadcast.target_area}
    )

    log_audit(
        db=db,
        action="CREATE_BROADCAST",
        entity_type="EmergencyBroadcast",
        entity_id=str(broadcast.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state={"title": broadcast.title, "severity": broadcast.severity, "target": broadcast.target_area}
    )

    # Instant WebSocket blast
    await manager.broadcast("EMERGENCY_BROADCAST", {
        "broadcast_id": broadcast.id,
        "title": broadcast.title,
        "message": broadcast.message,
        "severity": broadcast.severity,
        "target_area": broadcast.target_area,
        "created_at": str(broadcast.created_at)
    })

    return broadcast


@router.delete("/{broadcast_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_broadcast(
    broadcast_id: int,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Deactivate an active broadcast."""
    b = db.query(models.EmergencyBroadcast).filter(models.EmergencyBroadcast.id == broadcast_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    b.is_active = False
    db.commit()
    return None
