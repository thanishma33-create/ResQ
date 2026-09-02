import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/analytics", tags=["Advanced Analytics & KPIs"])

@router.get("/overview", response_model=schemas.AnalyticsOverview)
def get_analytics_overview(
    disaster_id: Optional[int] = None,
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Consolidated Command Center analytics KPIs, response benchmarks,
    resource availability, and shelter utilization statistics.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # Base emergency query
    base_eq = db.query(models.Emergency).filter(models.Emergency.created_at >= cutoff)
    if disaster_id:
        base_eq = base_eq.filter(models.Emergency.disaster_id == disaster_id)

    emergencies = base_eq.all()

    total_emergencies = len(emergencies)
    pending_emergencies = sum(1 for e in emergencies if e.status == "PENDING")
    in_progress_emergencies = sum(1 for e in emergencies if e.status in ("VERIFIED", "ASSIGNED", "EN_ROUTE", "ON_SCENE"))
    resolved_emergencies = sum(1 for e in emergencies if e.status == "RESOLVED")

    # Groupings
    by_sev: Dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    by_status: Dict[str, int] = {}
    by_type: Dict[str, int] = {}

    resolution_durations = []
    response_durations = []

    for e in emergencies:
        sev = (e.severity or "LOW").upper()
        by_sev[sev] = by_sev.get(sev, 0) + 1

        st = (e.status or "PENDING").upper()
        by_status[st] = by_status.get(st, 0) + 1

        t = (e.emergency_type or "other").lower()
        by_type[t] = by_type.get(t, 0) + 1

        # Calculate resolution duration in minutes
        if e.resolved_at and e.created_at:
            duration = (e.resolved_at - e.created_at).total_seconds() / 60.0
            if duration > 0:
                resolution_durations.append(duration)

    avg_resolution_mins = round(sum(resolution_durations) / len(resolution_durations), 1) if resolution_durations else 45.0

    # Calculate average response time from assignments
    assignments = db.query(models.Assignment).all()
    for a in assignments:
        if a.emergency and a.assigned_at and a.emergency.created_at:
            resp = (a.assigned_at - a.emergency.created_at).total_seconds() / 60.0
            if resp > 0:
                response_durations.append(resp)

    avg_response_mins = round(sum(response_durations) / len(response_durations), 1) if response_durations else 12.5

    # Rescue Teams
    teams = db.query(models.RescueTeam).all()
    total_teams = len(teams)
    avail_teams = sum(1 for t in teams if t.status == "AVAILABLE")

    # Volunteers
    volunteers = db.query(models.Volunteer).all()
    total_vols = len(volunteers)
    avail_vols = sum(1 for v in volunteers if v.availability == "AVAILABLE")

    # Shelters
    shelters = db.query(models.Shelter).all()
    total_shelters = len(shelters)
    total_capacity = sum(s.capacity for s in shelters)
    total_occupied = sum(s.occupied for s in shelters)
    occupancy_rate = round((total_occupied / total_capacity * 100.0), 1) if total_capacity > 0 else 0.0

    # Resources shortage count
    resources = db.query(models.Resource).all()
    shortage_items = sum(1 for r in resources if r.available_quantity <= 10)

    # Active Disasters
    active_disasters = db.query(models.DisasterEvent).filter(models.DisasterEvent.is_active == True).count()

    return schemas.AnalyticsOverview(
        total_emergencies=total_emergencies,
        pending_emergencies=pending_emergencies,
        in_progress_emergencies=in_progress_emergencies,
        resolved_emergencies=resolved_emergencies,
        emergencies_by_severity=by_sev,
        emergencies_by_status=by_status,
        emergencies_by_type=by_type,
        total_rescue_teams=total_teams,
        available_rescue_teams=avail_teams,
        total_volunteers=total_vols,
        available_volunteers=avail_vols,
        total_shelters=total_shelters,
        total_shelter_capacity=total_capacity,
        total_shelter_occupied=total_occupied,
        shelter_occupancy_rate_pct=occupancy_rate,
        resource_shortages_count=shortage_items,
        active_disasters_count=active_disasters,
        avg_response_time_minutes=avg_response_mins,
        avg_resolution_time_minutes=avg_resolution_mins
    )


@router.get("/trends", response_model=Dict[str, Any])
def get_emergency_trends(days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    """Daily time-series emergency count and resolution breakdown."""
    start_date = datetime.datetime.utcnow().date() - datetime.timedelta(days=days - 1)
    
    daily_stats = {}
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        day_str = str(day)
        daily_stats[day_str] = {"date": day_str, "total": 0, "resolved": 0, "critical": 0}

    emergencies = db.query(models.Emergency).filter(models.Emergency.created_at >= start_date).all()
    for e in emergencies:
        day_str = str(e.created_at.date())
        if day_str in daily_stats:
            daily_stats[day_str]["total"] += 1
            if e.status == "RESOLVED":
                daily_stats[day_str]["resolved"] += 1
            if e.severity == "CRITICAL":
                daily_stats[day_str]["critical"] += 1

    return {"days": days, "trend": list(daily_stats.values())}
