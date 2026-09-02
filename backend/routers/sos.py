import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_optional_current_user
from ai.priority_engine import calculate_priority_score
from services.incident_history_service import log_incident_event
from services.notification_service import create_notification
from services.duplicate_service import check_for_duplicates
from services.audit_service import log_audit
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/sos", tags=["Instant SOS & Offline Synchronization"])

def validate_coordinates(lat: float, lon: float):
    """Validates GPS coordinate bounds."""
    if lat is None or not (-90.0 <= float(lat) <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid latitude {lat}. Latitude must be between -90 and 90 degrees."
        )
    if lon is None or not (-180.0 <= float(lon) <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid longitude {lon}. Longitude must be between -180 and 180 degrees."
        )

def process_single_sos(
    sos_in: schemas.SOSCreate,
    db: Session,
    current_user: Optional[models.User] = None
) -> schemas.SOSOut:
    """
    Core idempotent SOS processing routine.
    Prevents duplicates upon retries while preserving offline creation timestamps.
    """
    validate_coordinates(sos_in.latitude, sos_in.longitude)

    client_sos_id = sos_in.client_sos_id or sos_in.client_id
    now = datetime.datetime.utcnow()
    client_created_at = sos_in.client_created_at or sos_in.created_at or now

    # 1. Idempotency Check
    if client_sos_id:
        existing = db.query(models.Emergency).filter(
            (models.Emergency.client_sos_id == client_sos_id) |
            (models.Emergency.client_id == client_sos_id)
        ).first()

        if existing:
            # Audit log for duplicate idempotent sync retry
            log_audit(
                db=db,
                action="OFFLINE_SOS_ALREADY_SYNCED",
                entity_type="Emergency",
                entity_id=str(existing.id),
                user_id=current_user.id if current_user else None,
                username=current_user.username if current_user else sos_in.name,
                new_state={"client_sos_id": client_sos_id, "emergency_id": existing.id, "duplicate": True}
            )
            return schemas.SOSOut(
                success=True,
                duplicate=True,
                message="SOS already synchronized",
                emergency_id=existing.id,
                client_sos_id=existing.client_sos_id or client_sos_id,
                priority_score=existing.priority_score or 85.0,
                severity=existing.severity or "CRITICAL",
                status=existing.status or "PENDING",
                timestamp=existing.created_at,
                client_created_at=existing.client_created_at or existing.created_at,
                server_received_at=existing.server_received_at or existing.created_at
            )

    # 2. Calculate Waiting Time from Original Offline Creation Timestamp
    waiting_time_mins = 0.0
    if client_created_at:
        try:
            c_time = client_created_at.replace(tzinfo=None) if hasattr(client_created_at, 'tzinfo') and client_created_at.tzinfo else client_created_at
            waiting_time_mins = max(0.0, (now - c_time).total_seconds() / 60.0)
        except Exception:
            waiting_time_mins = 0.0

    # 3. AI Emergency Prioritization
    score, severity, reasons = calculate_priority_score(
        people_affected=sos_in.people,
        injured_persons=1 if sos_in.medical_needed else 0,
        medical_required=sos_in.medical_needed,
        trapped=sos_in.trapped,
        children=sos_in.children or 0,
        elderly=sos_in.elderly or 0,
        pregnant_persons=sos_in.pregnant_persons or 0,
        disabled_persons=sos_in.disabled_persons or 0,
        disaster_risk_level="high",
        waiting_time_minutes=waiting_time_mins
    )

    # Guarantee critical tier for distress calls
    if score < 75.0:
        score = 85.0
        severity = "CRITICAL"
        reasons.insert(0, "URGENT SOS TRIGGERED (+30 pts emergency distress)")

    if waiting_time_mins > 10.0:
        reasons.append(f"Offline wait latency: ~{int(waiting_time_mins)} min (+15 pts)")

    user_id = current_user.id if current_user else None

    # 4. Create Emergency Record inside Transaction
    emergency = models.Emergency(
        client_id=client_sos_id,
        client_sos_id=client_sos_id,
        emergency_type="sos_distress",
        description=f"URGENT SOS: {sos_in.message} | Contact: {sos_in.phone}",
        latitude=sos_in.latitude,
        longitude=sos_in.longitude,
        gps_accuracy=sos_in.gps_accuracy,
        address=f"GPS: ({sos_in.latitude:.4f}, {sos_in.longitude:.4f})",
        people_affected=sos_in.people,
        children=sos_in.children or 0,
        elderly=sos_in.elderly or 0,
        pregnant_persons=sos_in.pregnant_persons or 0,
        disabled_persons=sos_in.disabled_persons or 0,
        medical_required=sos_in.medical_needed,
        trapped=sos_in.trapped,
        severity=severity,
        priority_score=score,
        priority_reasons=json.dumps(reasons),
        status="PENDING",
        reported_by_user_id=user_id,
        reporter_name=sos_in.name,
        reporter_phone=sos_in.phone,
        client_created_at=client_created_at,
        server_received_at=now,
        sync_status="SYNCED"
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # 5. Check Proximity Duplicate Reports (without dropping record)
    check_for_duplicates(db=db, emergency=emergency)

    # 6. Log Incident History
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="CREATED",
        description=f"CRITICAL SOS Distress signal triggered by {sos_in.name} ({sos_in.phone}) [Client ID: {client_sos_id or 'DIRECT'}]",
        actor_user_id=user_id,
        actor_name=sos_in.name,
        metadata={
            "sos": True,
            "score": score,
            "client_sos_id": client_sos_id,
            "waiting_time_mins": round(waiting_time_mins, 1)
        }
    )

    # 7. Record Immutable Audit Log
    log_audit(
        db=db,
        action="OFFLINE_SOS_SYNCED" if client_sos_id else "SOS_CREATED",
        entity_type="Emergency",
        entity_id=str(emergency.id),
        user_id=user_id,
        username=current_user.username if current_user else sos_in.name,
        new_state={
            "emergency_id": emergency.id,
            "client_sos_id": client_sos_id,
            "priority_score": score,
            "severity": severity,
            "waiting_time_mins": round(waiting_time_mins, 1)
        }
    )

    # 8. Create Urgent System Notification
    create_notification(
        db=db,
        title=f"🚨 URGENT SOS ALERT - {sos_in.name}",
        message=f"Distress call from {sos_in.phone} at ({sos_in.latitude:.4f}, {sos_in.longitude:.4f}). {sos_in.people} people affected.",
        notification_type="SOS",
        severity="CRITICAL",
        metadata={
            "emergency_id": emergency.id,
            "latitude": sos_in.latitude,
            "longitude": sos_in.longitude,
            "client_sos_id": client_sos_id
        }
    )

    return schemas.SOSOut(
        success=True,
        duplicate=False,
        message="SOS Alert received and dispatched to nearest rescue response teams.",
        emergency_id=emergency.id,
        client_sos_id=client_sos_id,
        priority_score=score,
        severity=severity,
        status=emergency.status,
        timestamp=emergency.created_at,
        client_created_at=emergency.client_created_at,
        server_received_at=emergency.server_received_at
    )


@router.post("/", response_model=schemas.SOSOut, status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(
    sos_in: schemas.SOSCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """
    Rapid 1-Click SOS Reporting API with Idempotent Deduplication.
    Calculates AI priority with wait-time penalty, creates emergency record,
    and broadcasts an urgent SOS alert across WebSockets to all operators and teams.
    """
    result = process_single_sos(sos_in=sos_in, db=db, current_user=current_user)

    if not result.duplicate:
        # Broadcast real-time WebSocket event
        await manager.broadcast("SOS_ALERT", {
            "emergency_id": result.emergency_id,
            "client_sos_id": result.client_sos_id,
            "name": sos_in.name,
            "phone": sos_in.phone,
            "latitude": sos_in.latitude,
            "longitude": sos_in.longitude,
            "people": sos_in.people,
            "message": sos_in.message,
            "severity": result.severity,
            "priority_score": result.priority_score,
            "timestamp": str(result.timestamp)
        })

    return result


@router.post("/sync", response_model=schemas.SOSBatchSyncResponse)
async def sync_offline_sos_batch(
    batch_in: schemas.SOSBatchSyncRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """
    Batch Offline SOS Synchronization Endpoint.
    Idempotently processes multiple queued SOS records from client IndexedDB.
    Guarantees item-level fault isolation: valid items succeed even if others fail.
    """
    synced_count = 0
    already_synced_count = 0
    failed_count = 0
    results: List[schemas.SOSBatchSyncItemResult] = []

    for item in batch_in.items:
        client_sos_id = item.client_sos_id or item.client_id
        try:
            res = process_single_sos(sos_in=item, db=db, current_user=current_user)
            if res.duplicate:
                already_synced_count += 1
                results.append(
                    schemas.SOSBatchSyncItemResult(
                        client_sos_id=client_sos_id,
                        client_id=client_sos_id,
                        emergency_id=res.emergency_id,
                        status="already_synced",
                        duplicate=True,
                        message="SOS already synchronized",
                        priority_score=res.priority_score,
                        severity=res.severity
                    )
                )
            else:
                synced_count += 1
                # Broadcast WebSocket event
                await manager.broadcast("SOS_ALERT", {
                    "emergency_id": res.emergency_id,
                    "client_sos_id": client_sos_id,
                    "name": item.name,
                    "phone": item.phone,
                    "latitude": item.latitude,
                    "longitude": item.longitude,
                    "people": item.people,
                    "severity": res.severity,
                    "priority_score": res.priority_score,
                    "timestamp": str(res.timestamp)
                })
                results.append(
                    schemas.SOSBatchSyncItemResult(
                        client_sos_id=client_sos_id,
                        client_id=client_sos_id,
                        emergency_id=res.emergency_id,
                        status="synced",
                        duplicate=False,
                        message="SOS successfully synchronized",
                        priority_score=res.priority_score,
                        severity=res.severity
                    )
                )
        except Exception as e:
            failed_count += 1
            error_msg = str(getattr(e, "detail", str(e)))
            log_audit(
                db=db,
                action="OFFLINE_SOS_SYNC_FAILED",
                entity_type="Emergency",
                user_id=current_user.id if current_user else None,
                username=current_user.username if current_user else item.name,
                new_state={"client_sos_id": client_sos_id, "error": error_msg}
            )
            results.append(
                schemas.SOSBatchSyncItemResult(
                    client_sos_id=client_sos_id,
                    client_id=client_sos_id,
                    status="failed",
                    duplicate=False,
                    message="Synchronization failed",
                    error=error_msg
                )
            )

    return schemas.SOSBatchSyncResponse(
        success=True,
        total=len(batch_in.items),
        synced_count=synced_count,
        already_synced_count=already_synced_count,
        failed_count=failed_count,
        results=results
    )
