import datetime
import re
from typing import List, Optional
from sqlalchemy.orm import Session
from utils.geo import haversine_distance_meters
import models

def tokenize_text(text: str) -> set:
    """Extracts lowercase alphabetic words from text."""
    if not text:
        return set()
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return set(words)

def compute_text_similarity(text1: str, text2: str) -> float:
    """Computes Jaccard word similarity between two texts."""
    tokens1 = tokenize_text(text1)
    tokens2 = tokenize_text(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union) if union else 0.0

def check_for_duplicates(
    db: Session,
    emergency: models.Emergency,
    max_distance_meters: float = 1000.0,
    max_time_hours: float = 24.0
) -> List[models.EmergencyDuplicate]:
    """
    Scans recent emergencies within geographic and temporal radius to identify
    potential duplicate emergency reports without automatically deleting or merging.
    """
    time_cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=max_time_hours)
    
    # Query candidates excluding the current emergency itself
    candidates = db.query(models.Emergency).filter(
        models.Emergency.id != emergency.id,
        models.Emergency.created_at >= time_cutoff,
        models.Emergency.status != "CANCELLED"
    ).all()

    duplicates_found: List[models.EmergencyDuplicate] = []

    for cand in candidates:
        dist_m = haversine_distance_meters(emergency.latitude, emergency.longitude, cand.latitude, cand.longitude)
        if dist_m > max_distance_meters:
            continue

        time_diff_mins = abs((emergency.created_at - cand.created_at).total_seconds()) / 60.0

        # Type match score (0.0 to 0.4)
        type_match = 0.4 if emergency.emergency_type.lower() == cand.emergency_type.lower() else 0.1

        # Text similarity on description + address (0.0 to 0.4)
        text_sim = compute_text_similarity(
            f"{emergency.description} {emergency.address}",
            f"{cand.description} {cand.address}"
        ) * 0.4

        # Proximity score (0.0 to 0.2)
        proximity_factor = max(0.0, (max_distance_meters - dist_m) / max_distance_meters) * 0.2

        total_similarity = round(min(1.0, type_match + text_sim + proximity_factor), 2)

        # Threshold check: either high composite similarity OR extreme proximity with same type
        if total_similarity >= 0.45 or (dist_m <= 300.0 and emergency.emergency_type.lower() == cand.emergency_type.lower()):
            dup_record = models.EmergencyDuplicate(
                original_emergency_id=cand.id,
                duplicate_emergency_id=emergency.id,
                similarity_score=total_similarity,
                distance_meters=dist_m,
                time_diff_minutes=round(time_diff_mins, 1),
                status="SUSPECTED"
            )
            db.add(dup_record)
            duplicates_found.append(dup_record)

    if duplicates_found:
        emergency.is_duplicate = True
        emergency.duplicate_of_id = duplicates_found[0].original_emergency_id
        emergency.duplicate_status = "SUSPECTED"
        db.commit()

    return duplicates_found
