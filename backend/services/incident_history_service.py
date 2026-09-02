import json
from typing import Optional, Any
from sqlalchemy.orm import Session
import models

def log_incident_event(
    db: Session,
    emergency_id: int,
    event_type: str,
    description: str,
    actor_user_id: Optional[int] = None,
    actor_name: Optional[str] = None,
    metadata: Optional[Any] = None
) -> models.IncidentHistory:
    """Records a chronological incident milestone for an emergency lifecycle."""
    meta_str = json.dumps(metadata, default=str) if metadata is not None else None

    entry = models.IncidentHistory(
        emergency_id=emergency_id,
        event_type=event_type,
        description=description,
        actor_user_id=actor_user_id,
        actor_name=actor_name,
        metadata_json=meta_str
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
