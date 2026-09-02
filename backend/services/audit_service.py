import json
from typing import Optional, Any
from sqlalchemy.orm import Session
import models

def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    previous_state: Optional[Any] = None,
    new_state: Optional[Any] = None,
    notes: Optional[str] = None,
    ip_address: Optional[str] = None
) -> models.AuditLog:
    """Records an immutable audit trail entry."""
    prev_str = json.dumps(previous_state, default=str) if previous_state is not None else None
    if new_state is not None:
        new_str = json.dumps(new_state, default=str) if not isinstance(new_state, str) else new_state
    elif notes is not None:
        new_str = json.dumps({"notes": notes}, default=str)
    else:
        new_str = None

    entry = models.AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        previous_state=prev_str,
        new_state=new_str,
        ip_address=ip_address
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
