import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
from auth import get_current_user, RoleChecker
from services.incident_history_service import log_incident_event
from services.notification_service import create_notification
from services.audit_service import log_audit
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/assignments", tags=["Dispatch & Workflow Assignments"])

@router.get("/", response_model=List[schemas.AssignmentOut])
def list_assignments(
    emergency_id: Optional[int] = None,
    rescue_team_id: Optional[int] = None,
    volunteer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List operational response assignments with team/volunteer relations."""
    query = db.query(models.Assignment).options(
        joinedload(models.Assignment.rescue_team),
        joinedload(models.Assignment.volunteer)
    )

    if emergency_id:
        query = query.filter(models.Assignment.emergency_id == emergency_id)
    if rescue_team_id:
        query = query.filter(models.Assignment.rescue_team_id == rescue_team_id)
    if volunteer_id:
        query = query.filter(models.Assignment.volunteer_id == volunteer_id)
    if status:
        query = query.filter(models.Assignment.status == status.upper())

    return query.order_by(models.Assignment.created_at.desc()).all()


@router.post("/", response_model=schemas.AssignmentOut, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: schemas.AssignmentCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Assign a Rescue Team or Volunteer to an emergency incident."""
    emergency = db.query(models.Emergency).filter(models.Emergency.id == assignment_in.emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    if emergency.status in ("RESOLVED", "CANCELLED"):
        raise HTTPException(status_code=400, detail=f"Cannot assign to emergency in '{emergency.status}' status")

    role_type = assignment_in.role_type.upper()
    team = None
    volunteer = None

    if role_type == "RESCUE_TEAM":
        if not assignment_in.rescue_team_id:
            raise HTTPException(status_code=400, detail="rescue_team_id is required for RESCUE_TEAM assignment")
        team = db.query(models.RescueTeam).filter(models.RescueTeam.id == assignment_in.rescue_team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Rescue team not found")
        team.status = "ASSIGNED"
        emergency.assigned_team_id = team.id
        if emergency.status == "PENDING":
            emergency.status = "ASSIGNED"

    elif role_type == "VOLUNTEER":
        if not assignment_in.volunteer_id:
            raise HTTPException(status_code=400, detail="volunteer_id is required for VOLUNTEER assignment")
        volunteer = db.query(models.Volunteer).filter(models.Volunteer.id == assignment_in.volunteer_id).first()
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        volunteer.active_tasks_count = (volunteer.active_tasks_count or 0) + 1
        if volunteer.active_tasks_count >= (volunteer.max_tasks or 3):
            volunteer.availability = "BUSY"

    assignment = models.Assignment(
        emergency_id=assignment_in.emergency_id,
        rescue_team_id=assignment_in.rescue_team_id,
        volunteer_id=assignment_in.volunteer_id,
        assigned_by_user_id=current_user.id,
        status="PENDING",
        role_type=role_type,
        instructions=assignment_in.instructions,
        notes=assignment_in.notes,
        assigned_at=datetime.datetime.utcnow()
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Incident History & Audit
    target_name = team.name if team else (volunteer.name if volunteer else "Personnel")
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="ASSIGNED" if role_type == "RESCUE_TEAM" else "VOLUNTEERS_ASSIGNED",
        description=f"{role_type} '{target_name}' dispatched to scene by {current_user.full_name}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        metadata={"assignment_id": assignment.id, "target": target_name, "role_type": role_type}
    )

    log_audit(
        db=db,
        action="ASSIGN",
        entity_type="Assignment",
        entity_id=str(assignment.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state={"emergency_id": emergency.id, "role_type": role_type, "target": target_name}
    )

    # Real-Time WebSocket broadcast
    await manager.broadcast("ASSIGNMENT_CREATED", {
        "assignment_id": assignment.id,
        "emergency_id": emergency.id,
        "role_type": role_type,
        "target_name": target_name,
        "instructions": assignment.instructions
    })

    return assignment


@router.patch("/{assignment_id}/status", response_model=schemas.AssignmentOut)
async def update_assignment_status(
    assignment_id: int,
    update_in: schemas.AssignmentUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator", "rescue_team", "volunteer"])),
    db: Session = Depends(get_db)
):
    """Transition assignment lifecycle: PENDING -> ACCEPTED -> EN_ROUTE -> ON_SCENE -> COMPLETED / CANCELLED."""
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    new_status = (update_in.status or assignment.status).upper()
    old_status = assignment.status
    assignment.status = new_status
    if update_in.notes:
        assignment.notes = update_in.notes

    if new_status == "COMPLETED":
        assignment.completed_at = datetime.datetime.utcnow()

        # Release volunteer workload
        if assignment.volunteer_id:
            vol = db.query(models.Volunteer).filter(models.Volunteer.id == assignment.volunteer_id).first()
            if vol:
                vol.active_tasks_count = max(0, (vol.active_tasks_count or 1) - 1)
                if vol.active_tasks_count < (vol.max_tasks or 3) and vol.availability == "BUSY":
                    vol.availability = "AVAILABLE"

        # Release team status if no other active assignments
        if assignment.rescue_team_id:
            team = db.query(models.RescueTeam).filter(models.RescueTeam.id == assignment.rescue_team_id).first()
            if team:
                other_active = db.query(models.Assignment).filter(
                    models.Assignment.rescue_team_id == team.id,
                    models.Assignment.id != assignment.id,
                    models.Assignment.status.in_(["PENDING", "ACCEPTED", "EN_ROUTE", "ON_SCENE"])
                ).count()
                if other_active == 0:
                    team.status = "AVAILABLE"

    db.commit()
    db.refresh(assignment)

    # Incident History
    log_incident_event(
        db=db,
        emergency_id=assignment.emergency_id,
        event_type="STATUS_CHANGED",
        description=f"Assignment #{assignment.id} status changed from {old_status} to {new_status}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name
    )

    await manager.broadcast("ASSIGNMENT_UPDATED", {
        "assignment_id": assignment.id,
        "emergency_id": assignment.emergency_id,
        "status": new_status,
        "updated_by": current_user.full_name
    })

    return assignment
