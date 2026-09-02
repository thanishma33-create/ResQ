import json
import asyncio
from typing import Optional, Any
from sqlalchemy.orm import Session
from utils.websocket_manager import manager
import models

def create_notification(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "GENERAL",
    severity: str = "MEDIUM",
    user_id: Optional[int] = None,
    metadata: Optional[Any] = None
) -> models.Notification:
    """
    Creates a database notification and triggers real-time WebSocket broadcast.
    """
    meta_str = json.dumps(metadata, default=str) if metadata is not None else None

    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        severity=severity,
        metadata_json=meta_str,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Broadcast real-time event via WebSocket
    payload = {
        "id": notif.id,
        "user_id": notif.user_id,
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "severity": notif.severity,
        "created_at": str(notif.created_at),
        "metadata": metadata
    }

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast("NOTIFICATION", payload))
    except Exception:
        pass

    return notif
