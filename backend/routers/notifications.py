from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["System & User Notifications"])

@router.get("/", response_model=List[schemas.NotificationOut])
def list_notifications(
    unread_only: bool = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List system notifications applicable to the current user (including global broadcasts)."""
    query = db.query(models.Notification).filter(
        (models.Notification.user_id == current_user.id) | (models.Notification.user_id == None)
    )
    if unread_only:
        query = query.filter(models.Notification.is_read == False)

    return query.order_by(models.Notification.created_at.desc()).limit(100).all()


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve number of unread notifications for badge counts."""
    count = db.query(models.Notification).filter(
        ((models.Notification.user_id == current_user.id) | (models.Notification.user_id == None)),
        models.Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/mark-all-read", response_model=dict)
def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications for the user as read."""
    db.query(models.Notification).filter(
        ((models.Notification.user_id == current_user.id) | (models.Notification.user_id == None)),
        models.Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)

    db.commit()
    return {"message": "All notifications marked as read"}
