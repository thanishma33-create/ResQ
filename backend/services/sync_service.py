import json
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ai.priority_engine import calculate_priority_score
from services.incident_history_service import log_incident_event
from services.duplicate_service import check_for_duplicates
from services.notification_service import create_notification
import models
import schemas

def process_offline_batch(
    db: Session,
    items: List[schemas.EmergencyCreate],
    user_id: Optional[int] = None
) -> schemas.OfflineSyncResponse:
    """
    Processes an offline queue batch of emergencies with client_id idempotency.
    Guarantees that re-sent queued emergencies are not duplicated in the system.
    """
    synced_count = 0
    skipped_count = 0
    results = []

    for item in items:
        # Check idempotency if client_id is present
        if item.client_id:
            existing = db.query(models.Emergency).filter(models.Emergency.client_id == item.client_id).first()
            if existing:
                skipped_count += 1
                results.append({
                    "client_id": item.client_id,
                    "emergency_id": existing.id,
                    "status": "already_synced",
                    "priority_score": existing.priority_score,
                    "severity": existing.severity
                })
                continue

        # Look up disaster risk level if linked
        disaster_risk = "medium"
        if item.disaster_id:
            disaster = db.query(models.DisasterEvent).filter(models.DisasterEvent.id == item.disaster_id).first()
            if disaster:
                disaster_risk = disaster.risk_level

        # Calculate waiting time from offline created_at
        now = datetime.datetime.utcnow()
        waiting_time_mins = 0.0
        if getattr(item, 'created_at', None):
            try:
                c_time = item.created_at.replace(tzinfo=None) if hasattr(item.created_at, 'tzinfo') and item.created_at.tzinfo else item.created_at
                waiting_time_mins = max(0.0, (now - c_time).total_seconds() / 60.0)
            except Exception:
                waiting_time_mins = 0.0

        # Calculate AI priority score
        score, severity, reasons = calculate_priority_score(
            people_affected=item.people_affected,
            injured_persons=item.injured_persons,
            medical_required=item.medical_required,
            trapped=item.trapped,
            children=item.children,
            elderly=item.elderly,
            pregnant_persons=item.pregnant_persons,
            disabled_persons=item.disabled_persons,
            disaster_risk_level=disaster_risk,
            waiting_time_minutes=waiting_time_mins
        )

        req_resources_json = json.dumps(item.required_resources or [])
        reasons_json = json.dumps(reasons)

        new_emergency = models.Emergency(
            client_id=item.client_id,
            client_sos_id=item.client_id,
            emergency_type=item.emergency_type,
            description=item.description,
            latitude=item.latitude,
            longitude=item.longitude,
            address=item.address,
            people_affected=item.people_affected,
            children=item.children,
            elderly=item.elderly,
            pregnant_persons=item.pregnant_persons,
            disabled_persons=item.disabled_persons,
            injured_persons=item.injured_persons,
            medical_required=item.medical_required,
            trapped=item.trapped,
            required_resources=req_resources_json,
            severity=severity,
            priority_score=score,
            priority_reasons=reasons_json,
            status="PENDING",
            disaster_id=item.disaster_id,
            reported_by_user_id=user_id,
            reporter_name=item.reporter_name,
            reporter_phone=item.reporter_phone,
            client_created_at=getattr(item, 'created_at', now),
            server_received_at=now,
            sync_status="SYNCED"
        )
        db.add(new_emergency)
        db.commit()
        db.refresh(new_emergency)

        # Log incident creation
        log_incident_event(
            db=db,
            emergency_id=new_emergency.id,
            event_type="CREATED",
            description=f"Emergency synced from offline client queue (Type: {item.emergency_type}, Priority: {score})",
            actor_user_id=user_id,
            actor_name=item.reporter_name or "Offline Sync Client"
        )

        # Check for potential duplicates
        check_for_duplicates(db=db, emergency=new_emergency)

        # Create system notification
        create_notification(
            db=db,
            title=f"New Emergency Synced: {item.emergency_type.upper()}",
            message=f"{item.description[:80]}... at {item.address}",
            notification_type="CRITICAL_EMERGENCY" if severity == "CRITICAL" else "GENERAL",
            severity=severity,
            metadata={"emergency_id": new_emergency.id, "priority_score": score}
        )

        synced_count += 1
        results.append({
            "client_id": item.client_id,
            "emergency_id": new_emergency.id,
            "status": "synced",
            "priority_score": score,
            "severity": severity
        })

    return schemas.OfflineSyncResponse(
        synced=synced_count,
        duplicates_skipped=skipped_count,
        results=results
    )
