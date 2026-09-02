import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user, RoleChecker
from ai.volunteer_matcher import match_volunteers
from services.audit_service import log_audit

router = APIRouter(prefix="/api/volunteers", tags=["Volunteer Coordination & AI Matching"])

def _format_volunteer_out(v: models.Volunteer) -> schemas.VolunteerOut:
    skills_list = []
    if v.skills:
        try:
            if v.skills.startswith("["):
                skills_list = json.loads(v.skills)
            else:
                skills_list = [s.strip() for s in v.skills.split(",") if s.strip()]
        except Exception:
            skills_list = [v.skills]

    return schemas.VolunteerOut(
        id=v.id,
        user_id=v.user_id,
        name=v.name,
        email=v.email,
        phone=v.phone,
        skills=skills_list,
        latitude=v.latitude,
        longitude=v.longitude,
        address=v.address,
        availability=v.availability,
        active_tasks_count=v.active_tasks_count or 0,
        max_tasks=v.max_tasks or 3,
        rating=v.rating or 5.0,
        created_at=v.created_at,
        updated_at=v.updated_at
    )


@router.get("/", response_model=List[schemas.VolunteerOut])
def list_volunteers(
    availability: Optional[str] = None,
    skill: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List registered disaster relief volunteers."""
    query = db.query(models.Volunteer)
    if availability:
        query = query.filter(models.Volunteer.availability == availability.upper())
    if skill:
        query = query.filter(models.Volunteer.skills.ilike(f"%{skill}%"))

    volunteers = query.offset(skip).limit(limit).all()
    return [_format_volunteer_out(v) for v in volunteers]


@router.post("/", response_model=schemas.VolunteerOut, status_code=status.HTTP_201_CREATED)
def register_volunteer(
    volunteer_in: schemas.VolunteerCreate,
    db: Session = Depends(get_db)
):
    """Register a new volunteer profile with location and skill qualifications."""
    skills_json = json.dumps([s.lower().strip() for s in volunteer_in.skills])

    volunteer = models.Volunteer(
        user_id=volunteer_in.user_id,
        name=volunteer_in.name,
        email=volunteer_in.email,
        phone=volunteer_in.phone,
        skills=skills_json,
        latitude=volunteer_in.latitude,
        longitude=volunteer_in.longitude,
        address=volunteer_in.address,
        availability=volunteer_in.availability.upper(),
        max_tasks=volunteer_in.max_tasks,
        active_tasks_count=0,
        rating=5.0
    )
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)

    log_audit(
        db=db,
        action="CREATE",
        entity_type="Volunteer",
        entity_id=str(volunteer.id),
        user_id=volunteer.user_id,
        username=volunteer.name
    )

    return _format_volunteer_out(volunteer)


@router.get("/{volunteer_id}", response_model=schemas.VolunteerOut)
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Retrieve volunteer profile."""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return _format_volunteer_out(volunteer)


@router.put("/{volunteer_id}", response_model=schemas.VolunteerOut)
def update_volunteer(
    volunteer_id: int,
    volunteer_in: schemas.VolunteerUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update volunteer profile information, skills, or base coordinates."""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    fields = volunteer_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if field == "skills" and val is not None:
            setattr(volunteer, field, json.dumps([s.lower().strip() for s in val]))
        elif field == "availability" and val is not None:
            setattr(volunteer, field, val.upper())
        elif val is not None:
            setattr(volunteer, field, val)

    db.commit()
    db.refresh(volunteer)
    return _format_volunteer_out(volunteer)


@router.patch("/{volunteer_id}/availability", response_model=schemas.VolunteerOut)
def update_availability(
    volunteer_id: int,
    availability: str = Query(..., pattern="^(AVAILABLE|BUSY|OFFLINE)$"),
    db: Session = Depends(get_db)
):
    """Update real-time volunteer availability status (AVAILABLE, BUSY, OFFLINE)."""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer.availability = availability.upper()
    db.commit()
    db.refresh(volunteer)
    return _format_volunteer_out(volunteer)


@router.post("/ai-match", response_model=schemas.VolunteerMatchResponse)
def match_volunteers_for_emergency(
    emergency_id: Optional[int] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    required_skills: List[str] = Query(default=[]),
    db: Session = Depends(get_db)
):
    """
    AI Volunteer Matching Engine Endpoint.
    Matches the best suited volunteers for an incident based on skill overlap,
    Haversine proximity, active workload, and availability.
    """
    target_lat = lat
    target_lon = lon

    # If emergency_id provided, fetch emergency location and needs
    if emergency_id:
        emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
        if not emergency:
            raise HTTPException(status_code=404, detail="Emergency not found")
        target_lat = emergency.latitude
        target_lon = emergency.longitude
        
        # Derive required skills if not provided
        if not required_skills:
            if emergency.medical_required or emergency.injured_persons > 0:
                required_skills.extend(["medical", "first_aid"])
            if emergency.trapped:
                required_skills.extend(["search_rescue", "driving"])
            if "food" in emergency.emergency_type.lower():
                required_skills.append("food_distribution")

    if target_lat is None or target_lon is None:
        raise HTTPException(status_code=400, detail="Must provide either emergency_id or target (lat, lon) coordinates")

    volunteers = db.query(models.Volunteer).filter(models.Volunteer.availability != "OFFLINE").all()
    matched_candidates = match_volunteers(
        required_skills=required_skills,
        target_latitude=target_lat,
        target_longitude=target_lon,
        volunteers=volunteers
    )

    return schemas.VolunteerMatchResponse(
        emergency_id=emergency_id,
        required_skills=required_skills,
        matched_volunteers=matched_candidates
    )
