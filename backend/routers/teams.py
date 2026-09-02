from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import RoleChecker, get_current_user
from services.audit_service import log_audit
from utils.geo import haversine_distance, estimate_eta_minutes, sort_by_distance
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/teams", tags=["Rescue & Response Teams"])

@router.get("/", response_model=List[schemas.RescueTeamOut])
def list_teams(
    status: Optional[str] = None,
    specialty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all rescue teams with optional status and specialty filters."""
    query = db.query(models.RescueTeam)
    if status:
        query = query.filter(models.RescueTeam.status == status.upper())
    if specialty:
        query = query.filter(models.RescueTeam.specialty.ilike(f"%{specialty}%"))
    return query.all()


@router.post("/", response_model=schemas.RescueTeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: schemas.RescueTeamCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Register a new specialized rescue team."""
    team = models.RescueTeam(
        name=team_in.name,
        team_leader=team_in.team_leader,
        contact_phone=team_in.contact_phone,
        specialty=team_in.specialty,
        latitude=team_in.latitude,
        longitude=team_in.longitude,
        base_location=team_in.base_location,
        status=team_in.status.upper(),
        max_capacity=team_in.max_capacity,
        user_id=team_in.user_id
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    log_audit(
        db=db,
        action="CREATE",
        entity_type="RescueTeam",
        entity_id=str(team.id),
        user_id=current_user.id,
        username=current_user.username
    )
    return team


@router.get("/nearest", response_model=List[dict])
def find_nearest_teams(
    lat: float = Query(..., description="Target Latitude"),
    lon: float = Query(..., description="Target Longitude"),
    status: Optional[str] = "AVAILABLE",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Finds nearest rescue teams to given coordinates with calculated ETA."""
    query = db.query(models.RescueTeam)
    if status:
        query = query.filter(models.RescueTeam.status == status.upper())
    
    teams = query.all()
    sorted_teams = sort_by_distance(lat, lon, teams)

    results = []
    for team, dist_km in sorted_teams[:limit]:
        eta = estimate_eta_minutes(dist_km, speed_kmh=45.0)
        results.append({
            "team": schemas.RescueTeamOut.model_validate(team),
            "distance_km": dist_km,
            "eta_minutes": eta
        })

    return results


@router.get("/{team_id}", response_model=schemas.RescueTeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific rescue team."""
    team = db.query(models.RescueTeam).filter(models.RescueTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Rescue team not found")
    return team


@router.put("/{team_id}", response_model=schemas.RescueTeamOut)
def update_team(
    team_id: int,
    team_in: schemas.RescueTeamUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator", "rescue_team"])),
    db: Session = Depends(get_db)
):
    """Update team details or operational status."""
    team = db.query(models.RescueTeam).filter(models.RescueTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Rescue team not found")

    fields = team_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if field == "status" and val is not None:
            setattr(team, field, val.upper())
        elif val is not None:
            setattr(team, field, val)

    db.commit()
    db.refresh(team)
    return team


@router.patch("/{team_id}/location", response_model=schemas.RescueTeamOut)
async def update_team_location(
    team_id: int,
    loc_in: schemas.RescueTeamLocationUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator", "rescue_team"])),
    db: Session = Depends(get_db)
):
    """Live GPS coordinate and status beacon update from response vehicle."""
    team = db.query(models.RescueTeam).filter(models.RescueTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Rescue team not found")

    team.latitude = loc_in.latitude
    team.longitude = loc_in.longitude
    if loc_in.status:
        team.status = loc_in.status.upper()

    db.commit()
    db.refresh(team)

    # Real-time WebSocket location update
    await manager.broadcast("TEAM_LOCATION_UPDATED", {
        "team_id": team.id,
        "name": team.name,
        "latitude": team.latitude,
        "longitude": team.longitude,
        "status": team.status
    })

    return team
