import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
from auth import get_current_user, get_optional_current_user, RoleChecker
from ai.priority_engine import calculate_priority_score
from services.incident_history_service import log_incident_event
from services.duplicate_service import check_for_duplicates
from services.notification_service import create_notification
from services.audit_service import log_audit
from services.sync_service import process_offline_batch
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/emergencies", tags=["Emergency Requests & Lifecycle"])

def _format_emergency_out(e: models.Emergency) -> schemas.EmergencyOut:
    """Helper to deserialize JSON lists in Emergency model for Pydantic schema."""
    req_res = []
    if e.required_resources:
        try:
            req_res = json.loads(e.required_resources)
        except Exception:
            req_res = [r.strip() for r in e.required_resources.split(",") if r.strip()]

    reasons = []
    if e.priority_reasons:
        try:
            reasons = json.loads(e.priority_reasons)
        except Exception:
            reasons = [e.priority_reasons]

    return schemas.EmergencyOut(
        id=e.id,
        client_id=e.client_id,
        emergency_type=e.emergency_type,
        description=e.description,
        latitude=e.latitude,
        longitude=e.longitude,
        address=e.address,
        people_affected=e.people_affected,
        children=e.children,
        elderly=e.elderly,
        pregnant_persons=e.pregnant_persons,
        disabled_persons=e.disabled_persons,
        injured_persons=e.injured_persons,
        medical_required=e.medical_required,
        trapped=e.trapped,
        required_resources=req_res,
        severity=e.severity,
        priority_score=e.priority_score,
        priority_reasons=reasons,
        status=e.status,
        disaster_id=e.disaster_id,
        reported_by_user_id=e.reported_by_user_id,
        reporter_name=e.reporter_name,
        reporter_phone=e.reporter_phone,
        assigned_team_id=e.assigned_team_id,
        is_duplicate=e.is_duplicate,
        duplicate_of_id=e.duplicate_of_id,
        duplicate_status=e.duplicate_status,
        resolution_notes=e.resolution_notes,
        resolved_at=e.resolved_at,
        created_at=e.created_at,
        updated_at=e.updated_at,
        assigned_team=schemas.RescueTeamOut.model_validate(e.assigned_team) if e.assigned_team else None,
        disaster=schemas.DisasterEventOut.model_validate(e.disaster) if e.disaster else None
    )


@router.post("/", response_model=schemas.EmergencyOut, status_code=status.HTTP_201_CREATED)
async def create_emergency(
    emergency_in: schemas.EmergencyCreate,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Create a new emergency request with automatic AI priority assessment and duplicate scanning."""
    # Check offline idempotency
    if emergency_in.client_id:
        existing = db.query(models.Emergency).filter(models.Emergency.client_id == emergency_in.client_id).first()
        if existing:
            return _format_emergency_out(existing)

    # Determine disaster risk level if linked
    disaster_risk = "medium"
    if emergency_in.disaster_id:
        disaster = db.query(models.DisasterEvent).filter(models.DisasterEvent.id == emergency_in.disaster_id).first()
        if disaster:
            disaster_risk = disaster.risk_level

    # AI Priority Engine calculation
    score, severity, reasons = calculate_priority_score(
        people_affected=emergency_in.people_affected,
        injured_persons=emergency_in.injured_persons,
        medical_required=emergency_in.medical_required,
        trapped=emergency_in.trapped,
        children=emergency_in.children,
        elderly=emergency_in.elderly,
        pregnant_persons=emergency_in.pregnant_persons,
        disabled_persons=emergency_in.disabled_persons,
        disaster_risk_level=disaster_risk,
        waiting_time_minutes=0.0
    )

    emergency = models.Emergency(
        client_id=emergency_in.client_id,
        emergency_type=emergency_in.emergency_type,
        description=emergency_in.description,
        latitude=emergency_in.latitude,
        longitude=emergency_in.longitude,
        address=emergency_in.address,
        people_affected=emergency_in.people_affected,
        children=emergency_in.children,
        elderly=emergency_in.elderly,
        pregnant_persons=emergency_in.pregnant_persons,
        disabled_persons=emergency_in.disabled_persons,
        injured_persons=emergency_in.injured_persons,
        medical_required=emergency_in.medical_required,
        trapped=emergency_in.trapped,
        required_resources=json.dumps(emergency_in.required_resources or []),
        severity=severity,
        priority_score=score,
        priority_reasons=json.dumps(reasons),
        status="PENDING",
        disaster_id=emergency_in.disaster_id,
        reported_by_user_id=current_user.id if current_user else None,
        reporter_name=emergency_in.reporter_name or (current_user.full_name if current_user else "Anonymous Citizen"),
        reporter_phone=emergency_in.reporter_phone or (current_user.phone if current_user else None)
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # Lifecycle Incident Event
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="CREATED",
        description=f"Emergency created. AI Assessment: {severity} severity (Score: {score}/100)",
        actor_user_id=current_user.id if current_user else None,
        actor_name=emergency.reporter_name,
        metadata={"priority_score": score, "reasons": reasons}
    )

    # Scan for potential duplicate reports
    check_for_duplicates(db=db, emergency=emergency)

    # System Notification & Broadcast
    create_notification(
        db=db,
        title=f"New Emergency: {emergency.emergency_type.upper()}",
        message=f"{emergency.description[:100]} | Location: {emergency.address}",
        notification_type="CRITICAL_EMERGENCY" if severity == "CRITICAL" else "GENERAL",
        severity=severity,
        metadata={"emergency_id": emergency.id, "priority_score": score, "severity": severity}
    )

    await manager.broadcast("NEW_EMERGENCY", {
        "emergency_id": emergency.id,
        "type": emergency.emergency_type,
        "severity": emergency.severity,
        "priority_score": emergency.priority_score,
        "latitude": emergency.latitude,
        "longitude": emergency.longitude,
        "address": emergency.address,
        "status": emergency.status,
        "created_at": str(emergency.created_at)
    })

    return _format_emergency_out(emergency)


@router.get("/", response_model=List[schemas.EmergencyOut])
def list_emergencies(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    emergency_type: Optional[str] = None,
    disaster_id: Optional[int] = None,
    search: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List emergencies with flexible filtering and sorting by priority score."""
    query = db.query(models.Emergency).options(
        joinedload(models.Emergency.assigned_team),
        joinedload(models.Emergency.disaster)
    )

    if status:
        query = query.filter(models.Emergency.status == status.upper())
    if severity:
        query = query.filter(models.Emergency.severity == severity.upper())
    if emergency_type:
        query = query.filter(models.Emergency.emergency_type.ilike(f"%{emergency_type}%"))
    if disaster_id:
        query = query.filter(models.Emergency.disaster_id == disaster_id)
    if is_duplicate is not None:
        query = query.filter(models.Emergency.is_duplicate == is_duplicate)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Emergency.description.ilike(search_fmt)) |
            (models.Emergency.address.ilike(search_fmt)) |
            (models.Emergency.reporter_name.ilike(search_fmt))
        )

    # Order by priority score descending, then created_at descending
    emergencies = query.order_by(models.Emergency.priority_score.desc(), models.Emergency.created_at.desc()).offset(skip).limit(limit).all()
    return [_format_emergency_out(e) for e in emergencies]


@router.get("/{emergency_id}", response_model=schemas.EmergencyOut)
def get_emergency(emergency_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific emergency."""
    emergency = db.query(models.Emergency).options(
        joinedload(models.Emergency.assigned_team),
        joinedload(models.Emergency.disaster)
    ).filter(models.Emergency.id == emergency_id).first()

    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    return _format_emergency_out(emergency)


@router.put("/{emergency_id}", response_model=schemas.EmergencyOut)
def update_emergency(
    emergency_id: int,
    update_in: schemas.EmergencyUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update emergency attributes and recalculate priority if demographics change."""
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    prev_state = {
        "status": emergency.status,
        "people_affected": emergency.people_affected,
        "severity": emergency.severity,
        "priority_score": emergency.priority_score
    }

    # Apply updates
    fields = update_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if field == "required_resources" and val is not None:
            setattr(emergency, field, json.dumps(val))
        elif val is not None:
            setattr(emergency, field, val)

    # Recalculate priority if demographics or disaster changed
    score, severity, reasons = calculate_priority_score(
        people_affected=emergency.people_affected,
        injured_persons=emergency.injured_persons,
        medical_required=emergency.medical_required,
        trapped=emergency.trapped,
        children=emergency.children,
        elderly=emergency.elderly,
        pregnant_persons=emergency.pregnant_persons,
        disabled_persons=emergency.disabled_persons,
        disaster_risk_level="high" if emergency.disaster_id else "medium"
    )
    emergency.priority_score = score
    emergency.severity = severity
    emergency.priority_reasons = json.dumps(reasons)

    db.commit()
    db.refresh(emergency)

    log_audit(
        db=db,
        action="UPDATE",
        entity_type="Emergency",
        entity_id=str(emergency.id),
        user_id=current_user.id,
        username=current_user.username,
        previous_state=prev_state,
        new_state={"priority_score": score, "severity": severity, "status": emergency.status}
    )

    return _format_emergency_out(emergency)


@router.patch("/{emergency_id}/status", response_model=schemas.EmergencyOut)
async def update_emergency_status(
    emergency_id: int,
    status_in: schemas.EmergencyStatusUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator", "rescue_team"])),
    db: Session = Depends(get_db)
):
    """Transition emergency workflow status: PENDING -> VERIFIED -> ASSIGNED -> EN_ROUTE -> ON_SCENE -> RESOLVED / CANCELLED."""
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    old_status = emergency.status
    new_status = status_in.status.upper()
    emergency.status = new_status

    if new_status == "RESOLVED":
        emergency.resolved_at = datetime.datetime.now(datetime.timezone.utc)
        if status_in.notes:
            emergency.resolution_notes = status_in.notes

    db.commit()
    db.refresh(emergency)

    # Incident history log
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="STATUS_CHANGED",
        description=f"Status changed from {old_status} to {new_status}. Notes: {status_in.notes or 'None'}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        metadata={"old_status": old_status, "new_status": new_status, "notes": status_in.notes}
    )

    # Audit log
    log_audit(
        db=db,
        action="UPDATE_STATUS",
        entity_type="Emergency",
        entity_id=str(emergency.id),
        user_id=current_user.id,
        username=current_user.username,
        previous_state={"status": old_status},
        new_state={"status": new_status}
    )

    # Real-time WebSocket broadcast
    await manager.broadcast("EMERGENCY_UPDATED", {
        "emergency_id": emergency.id,
        "old_status": old_status,
        "new_status": new_status,
        "updated_by": current_user.full_name
    })

    return _format_emergency_out(emergency)


@router.post("/{emergency_id}/recalculate-priority", response_model=schemas.PriorityScoreResult)
def recalculate_emergency_priority(
    emergency_id: int,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Recalculates and updates priority score and reasons using dynamic waiting time penalty."""
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    waiting_mins = 0.0
    if emergency.status in ("PENDING", "VERIFIED") and emergency.created_at:
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        created_dt = emergency.created_at
        if created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=datetime.timezone.utc)
        waiting_mins = (now_dt - created_dt).total_seconds() / 60.0

    score, severity, reasons = calculate_priority_score(
        people_affected=emergency.people_affected,
        injured_persons=emergency.injured_persons,
        medical_required=emergency.medical_required,
        trapped=emergency.trapped,
        children=emergency.children,
        elderly=emergency.elderly,
        pregnant_persons=emergency.pregnant_persons,
        disabled_persons=emergency.disabled_persons,
        waiting_time_minutes=waiting_mins
    )

    emergency.priority_score = score
    emergency.severity = severity
    emergency.priority_reasons = json.dumps(reasons)
    db.commit()

    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="PRIORITIZED",
        description=f"AI Priority recalculated: Score {score}, Severity {severity}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        metadata={"priority_score": score, "reasons": reasons}
    )

    return schemas.PriorityScoreResult(
        priority_score=score,
        severity=severity,
        reasons=reasons
    )


@router.post("/voice-report", response_model=schemas.EmergencyOut, status_code=status.HTTP_201_CREATED)
async def submit_voice_emergency(
    voice_payload: schemas.EmergencyVoiceReport,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts structured emergency data transcribed by client-side browser speech recognition.
    Persists the speech transcript in the emergency description and calculates AI priority.
    """
    structured = voice_payload.structured_data
    # Append transcript note
    full_description = f"{structured.description}\n[Voice Transcript]: \"{voice_payload.transcript}\""
    structured.description = full_description

    return await create_emergency(emergency_in=structured, current_user=current_user, db=db)


@router.post("/sync-offline", response_model=schemas.OfflineSyncResponse)
def sync_offline_emergencies(
    sync_request: schemas.OfflineSyncRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingests an offline batch queue of emergency reports with client_id idempotency.
    Prevents duplicate submissions when mobile/low-bandwidth devices reconnect.
    """
    user_id = current_user.id if current_user else None
    return process_offline_batch(db=db, items=sync_request.emergencies, user_id=user_id)
