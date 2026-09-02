import json
from typing import List, Optional
from utils.geo import haversine_distance, estimate_eta_minutes
import models
import schemas

def match_volunteers(
    required_skills: List[str],
    target_latitude: float,
    target_longitude: float,
    volunteers: List[models.Volunteer],
    max_results: int = 10
) -> List[schemas.VolunteerMatchItem]:
    """
    AI Volunteer Matching Engine.
    Matches and ranks candidate volunteers using:
    1. Skill relevance & coverage (40%)
    2. Proximity & Estimated Travel Time (40%)
    3. Real-time availability & active workload balance (20%)
    """
    req_skills_set = set([s.lower().strip() for s in required_skills if s.strip()])
    matched_items: List[schemas.VolunteerMatchItem] = []

    for vol in volunteers:
        # Parse volunteer skills
        vol_skills_raw = vol.skills
        vol_skills: List[str] = []
        if vol_skills_raw:
            try:
                if vol_skills_raw.startswith("["):
                    vol_skills = [str(s).lower().strip() for s in json.loads(vol_skills_raw)]
                else:
                    vol_skills = [s.lower().strip() for s in vol_skills_raw.split(",") if s.strip()]
            except Exception:
                vol_skills = [s.lower().strip() for s in vol_skills_raw.split(",") if s.strip()]

        vol_skills_set = set(vol_skills)
        common_skills = list(req_skills_set.intersection(vol_skills_set))

        # 1. Skill Score (Max 40 pts)
        if req_skills_set:
            skill_ratio = len(common_skills) / len(req_skills_set)
            skill_score = skill_ratio * 40.0
        else:
            skill_score = 25.0  # General volunteer need

        # 2. Distance & ETA (Max 40 pts)
        distance_km = haversine_distance(target_latitude, target_longitude, vol.latitude, vol.longitude)
        eta = estimate_eta_minutes(distance_km, speed_kmh=35.0)
        
        # Exponential or linear decay with distance (40 pts at 0km, 0 pts at 20km)
        dist_score = max(0.0, 40.0 - (distance_km * 2.0))

        # 3. Availability & Workload (Max 20 pts)
        avail_str = (vol.availability or "AVAILABLE").upper()
        if avail_str == "AVAILABLE":
            workload_penalty = min(15.0, (vol.active_tasks_count or 0) * 5.0)
            avail_score = max(5.0, 20.0 - workload_penalty)
        elif avail_str == "BUSY":
            avail_score = 4.0
        else:  # OFFLINE
            avail_score = 0.0

        total_match_score = round(min(100.0, skill_score + dist_score + avail_score), 1)

        # Build natural language reason
        reasons_list = []
        if common_skills:
            reasons_list.append(f"Matching skills: {', '.join(common_skills)}")
        elif vol_skills:
            reasons_list.append(f"Profile skills: {', '.join(vol_skills)}")
        else:
            reasons_list.append("General rescue support")

        reasons_list.append(f"{distance_km}km away (approx. {int(eta)} min ETA)")
        reasons_list.append(f"Status: {avail_str} ({vol.active_tasks_count} active task(s))")

        reason_str = " | ".join(reasons_list)

        matched_items.append(
            schemas.VolunteerMatchItem(
                volunteer_id=vol.id,
                name=vol.name,
                phone=vol.phone,
                distance_km=distance_km,
                eta_minutes=eta,
                matching_skills=common_skills,
                all_skills=vol_skills,
                match_score=total_match_score,
                availability=avail_str,
                active_tasks=vol.active_tasks_count or 0,
                reason=reason_str
            )
        )

    # Sort descending by match score
    matched_items.sort(key=lambda x: x.match_score, reverse=True)
    return matched_items[:max_results]
