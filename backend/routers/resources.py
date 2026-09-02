from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
from auth import get_current_user, RoleChecker
from ai.resource_recommender import recommend_resources
from services.incident_history_service import log_incident_event
from services.audit_service import log_audit
from utils.websocket_manager import manager

router = APIRouter(prefix="/api/resources", tags=["Resource Inventory & Allocation"])

@router.get("/", response_model=List[schemas.ResourceOut])
def list_resources(category: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all resources in inventory with optional category filter."""
    query = db.query(models.Resource)
    if category:
        query = query.filter(models.Resource.category.ilike(f"%{category}%"))
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.ResourceOut, status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_in: schemas.ResourceCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Add a new relief material/asset to the inventory."""
    resource = models.Resource(
        name=resource_in.name,
        category=resource_in.category.lower(),
        unit=resource_in.unit,
        total_quantity=resource_in.total_quantity,
        available_quantity=resource_in.available_quantity,
        reserved_quantity=resource_in.reserved_quantity,
        allocated_quantity=resource_in.allocated_quantity,
        latitude=resource_in.latitude,
        longitude=resource_in.longitude,
        location_name=resource_in.location_name
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    log_audit(
        db=db,
        action="CREATE",
        entity_type="Resource",
        entity_id=str(resource.id),
        user_id=current_user.id,
        username=current_user.username
    )

    return resource


@router.get("/{resource_id}", response_model=schemas.ResourceOut)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a specific inventory item."""
    res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource item not found")
    return res


@router.put("/{resource_id}", response_model=schemas.ResourceOut)
def update_resource(
    resource_id: int,
    res_in: schemas.ResourceUpdate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Update inventory quantity, location, or metadata."""
    res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource item not found")

    fields = res_in.model_dump(exclude_unset=True)
    for field, val in fields.items():
        if val is not None:
            setattr(res, field, val)

    db.commit()
    db.refresh(res)
    return res


@router.post("/ai-recommendation", response_model=schemas.ResourceRecommendationResponse)
def get_ai_resource_recommendation(
    emergency_id: Optional[int] = None,
    emergency_type: str = "general_evacuation",
    people_affected: int = 5,
    medical_required: bool = False,
    trapped: bool = False,
    severity: str = "MEDIUM",
    disaster_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    AI Resource Recommendation Engine Endpoint.
    Calculates supply quotas (food, water, medicine, life jackets, boats, etc.)
    and detects stock shortages in real-time. Does NOT lock or allocate inventory.
    """
    if emergency_id:
        emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
        if not emergency:
            raise HTTPException(status_code=404, detail="Emergency not found")
        emergency_type = emergency.emergency_type
        people_affected = emergency.people_affected
        medical_required = emergency.medical_required
        trapped = emergency.trapped
        severity = emergency.severity
        disaster_type = emergency.disaster.type if emergency.disaster else None

    recommendations = recommend_resources(
        emergency_type=emergency_type,
        people_affected=people_affected,
        medical_required=medical_required,
        trapped=trapped,
        severity=severity,
        disaster_type=disaster_type,
        db=db
    )

    return schemas.ResourceRecommendationResponse(
        emergency_id=emergency_id,
        emergency_type=emergency_type,
        people_affected=people_affected,
        severity=severity,
        recommendations=recommendations
    )


@router.post("/allocate", response_model=schemas.ResourceAllocationOut, status_code=status.HTTP_201_CREATED)
async def allocate_resource(
    alloc_in: schemas.ResourceAllocationCreate,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """
    Allocate specific inventory stock to an emergency.
    Strictly validates available quantity and prevents overallocation.
    """
    if alloc_in.allocated_quantity <= 0:
        raise HTTPException(status_code=400, detail="Allocated quantity must be greater than 0")

    emergency = db.query(models.Emergency).filter(models.Emergency.id == alloc_in.emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    resource = db.query(models.Resource).filter(models.Resource.id == alloc_in.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource item not found")

    # Strict inventory validation
    if resource.available_quantity < alloc_in.allocated_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot allocate {alloc_in.allocated_quantity} {resource.unit}. Only {resource.available_quantity} {resource.unit} currently available in inventory."
        )

    # Deduct available quantity and increment allocated quantity
    resource.available_quantity -= alloc_in.allocated_quantity
    resource.allocated_quantity += alloc_in.allocated_quantity

    allocation = models.ResourceAllocation(
        emergency_id=alloc_in.emergency_id,
        resource_id=alloc_in.resource_id,
        allocated_quantity=alloc_in.allocated_quantity,
        status="ALLOCATED",
        allocated_by_user_id=current_user.id,
        notes=alloc_in.notes
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    # Incident history
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="RESOURCES_ALLOCATED",
        description=f"Allocated {alloc_in.allocated_quantity} {resource.unit} of '{resource.name}' by {current_user.full_name}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        metadata={"resource_id": resource.id, "quantity": alloc_in.allocated_quantity}
    )

    # Audit log
    log_audit(
        db=db,
        action="ALLOCATE_RESOURCE",
        entity_type="ResourceAllocation",
        entity_id=str(allocation.id),
        user_id=current_user.id,
        username=current_user.username,
        new_state={"resource": resource.name, "quantity": alloc_in.allocated_quantity, "emergency_id": emergency.id}
    )

    # Real-Time WebSocket broadcast
    await manager.broadcast("RESOURCE_ALLOCATED", {
        "allocation_id": allocation.id,
        "emergency_id": emergency.id,
        "resource_name": resource.name,
        "quantity": alloc_in.allocated_quantity,
        "unit": resource.unit
    })

    return allocation


@router.get("/allocations/all", response_model=List[schemas.ResourceAllocationOut])
def list_allocations(
    emergency_id: Optional[int] = None,
    resource_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List resource allocations with linked resource data."""
    query = db.query(models.ResourceAllocation).options(joinedload(models.ResourceAllocation.resource))
    if emergency_id:
        query = query.filter(models.ResourceAllocation.emergency_id == emergency_id)
    if resource_id:
        query = query.filter(models.ResourceAllocation.resource_id == resource_id)
    return query.order_by(models.ResourceAllocation.created_at.desc()).all()


@router.patch("/allocation/{allocation_id}/status", response_model=schemas.ResourceAllocationOut)
def update_allocation_status(
    allocation_id: int,
    new_status: str,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """Update allocation status (ALLOCATED, DISPATCHED, DELIVERED, RETURNED, CANCELLED). Restores inventory if cancelled/returned."""
    alloc = db.query(models.ResourceAllocation).filter(models.ResourceAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")

    old_status = alloc.status
    formatted_status = new_status.upper()
    alloc.status = formatted_status

    # If cancelled or returned, return stock to available pool
    if formatted_status in ("RETURNED", "CANCELLED") and old_status not in ("RETURNED", "CANCELLED"):
        res = db.query(models.Resource).filter(models.Resource.id == alloc.resource_id).first()
        if res:
            res.available_quantity += alloc.allocated_quantity
            res.allocated_quantity = max(0, res.allocated_quantity - alloc.allocated_quantity)

    db.commit()
    db.refresh(alloc)
    return alloc
