from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.incident_history_service import log_incident_event
from services.audit_service import log_audit

router = APIRouter(prefix="/api/duplicates", tags=["Duplicate Emergency Detection & Resolution"])

@router.get("/", response_model=List[schemas.EmergencyDuplicateOut])
def list_duplicates(status: Optional[str] = None, db: Session = Depends(get_db)):
    """List suspected and flagged duplicate emergency incidents."""
    query = db.query(models.EmergencyDuplicate)
    if status:
        query = query.filter(models.EmergencyDuplicate.status == status.upper())
    return query.order_by(models.EmergencyDuplicate.created_at.desc()).all()


@router.get("/{emergency_id}", response_model=List[schemas.EmergencyDuplicateOut])
def get_emergency_duplicates(emergency_id: int, db: Session = Depends(get_db)):
    """Get all duplicate candidate pairs linked to a specific emergency."""
    return db.query(models.EmergencyDuplicate).filter(
        (models.EmergencyDuplicate.original_emergency_id == emergency_id) |
        (models.EmergencyDuplicate.duplicate_emergency_id == emergency_id)
    ).all()


@router.post("/{duplicate_id}/resolve", response_model=schemas.EmergencyDuplicateOut)
def resolve_duplicate(
    duplicate_id: int,
    resolution: schemas.DuplicateResolution,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """
    Operator triage decision on duplicate candidate pair.
    Actions: CONFIRMED_DUPLICATE, SEPARATE, MERGED.
    """
    dup = db.query(models.EmergencyDuplicate).filter(models.EmergencyDuplicate.id == duplicate_id).first()
    if not dup:
        raise HTTPException(status_code=404, detail="Duplicate record not found")

    new_status = resolution.status.upper()
    dup.status = new_status
    dup.reviewed_by_user_id = current_user.id
    dup.notes = resolution.notes

    dup_emergency = db.query(models.Emergency).filter(models.Emergency.id == dup.duplicate_emergency_id).first()
    if dup_emergency:
        dup_emergency.duplicate_status = new_status
        if new_status == "CONFIRMED_DUPLICATE":
            dup_emergency.status = "CANCELLED"
            dup_emergency.resolution_notes = f"Marked as duplicate of Emergency #{dup.original_emergency_id}"
        elif new_status == "SEPARATE":
            dup_emergency.is_duplicate = False
        elif new_status == "MERGED":
            dup_emergency.status = "CANCELLED"
            dup_emergency.resolution_notes = f"Merged into Emergency #{dup.original_emergency_id}"

    db.commit()
    db.refresh(dup)

    # Log Incident Event
    log_incident_event(
        db=db,
        emergency_id=dup.original_emergency_id,
        event_type="DUPLICATE_FLAGGED",
        description=f"Duplicate report #{dup.duplicate_emergency_id} triage completed: {new_status}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name
    )

    log_audit(
        db=db,
        action="RESOLVE_DUPLICATE",
        entity_type="EmergencyDuplicate",
        entity_id=str(dup.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state={"status": new_status, "original": dup.original_emergency_id, "duplicate": dup.duplicate_emergency_id}
    )

    return dup
