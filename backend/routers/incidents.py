from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/incidents", tags=["Incident Lifecycle & History"])

@router.get("/emergency/{emergency_id}", response_model=List[schemas.IncidentHistoryOut])
def get_emergency_incident_history(emergency_id: int, db: Session = Depends(get_db)):
    """Retrieve full chronological timeline and milestone logs of an emergency incident."""
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    return db.query(models.IncidentHistory).filter(
        models.IncidentHistory.emergency_id == emergency_id
    ).order_by(models.IncidentHistory.created_at.asc()).all()
