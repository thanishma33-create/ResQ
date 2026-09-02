from typing import List, Tuple

def calculate_priority_score(
    people_affected: int = 1,
    injured_persons: int = 0,
    medical_required: bool = False,
    trapped: bool = False,
    children: int = 0,
    elderly: int = 0,
    pregnant_persons: int = 0,
    disabled_persons: int = 0,
    disaster_risk_level: str = "medium",
    waiting_time_minutes: float = 0.0
) -> Tuple[float, str, List[str]]:
    """
    Modular AI Priority Scoring Engine for Disaster Emergencies.
    Computes a weighted priority score between 0.0 and 100.0,
    determines severity tier (LOW, MEDIUM, HIGH, CRITICAL),
    and produces explainable natural language reasons.
    """
    score = 0.0
    reasons = []

    # 1. Trapped status (Immediate threat to life)
    if trapped:
        score += 35.0
        reasons.append("Immediate threat to life: Persons reported trapped (+35 pts)")

    # 2. Medical urgency
    if medical_required:
        score += 25.0
        reasons.append("Critical medical intervention required (+25 pts)")

    # 3. Injured persons scaling
    if injured_persons > 0:
        injury_score = min(30.0, injured_persons * 8.0)
        score += injury_score
        reasons.append(f"{injured_persons} injured individual(s) reported (+{injury_score:.1f} pts)")

    # 4. Vulnerable demographics (Children, Elderly, Pregnant, Disabled)
    vulnerable_count = children + elderly + pregnant_persons + disabled_persons
    if vulnerable_count > 0:
        vuln_parts = []
        if children > 0:
            vuln_parts.append(f"{children} children")
        if elderly > 0:
            vuln_parts.append(f"{elderly} elderly")
        if pregnant_persons > 0:
            vuln_parts.append(f"{pregnant_persons} pregnant")
        if disabled_persons > 0:
            vuln_parts.append(f"{disabled_persons} disabled")
        
        vuln_score = min(25.0, (children * 5.0) + (elderly * 4.0) + (pregnant_persons * 6.0) + (disabled_persons * 5.0))
        score += vuln_score
        reasons.append(f"High-vulnerability demographic ({', '.join(vuln_parts)}) (+{vuln_score:.1f} pts)")

    # 5. Scale of people affected
    if people_affected > 1:
        people_score = min(15.0, (people_affected - 1) * 2.0)
        score += people_score
        reasons.append(f"Scale of impact: {people_affected} people affected (+{people_score:.1f} pts)")

    # 6. Disaster context multiplier / bonus
    risk_level_normalized = (disaster_risk_level or "medium").lower()
    if risk_level_normalized == "critical":
        score += 15.0
        reasons.append("Associated with CRITICAL disaster event (+15 pts)")
    elif risk_level_normalized == "high":
        score += 10.0
        reasons.append("Associated with HIGH disaster risk event (+10 pts)")
    elif risk_level_normalized == "medium":
        score += 5.0
        reasons.append("Disaster perimeter active (+5 pts)")

    # 7. Waiting time penalty (Dynamic escalation)
    if waiting_time_minutes > 15.0:
        wait_bonus = min(15.0, (waiting_time_minutes / 30.0) * 5.0)
        score += wait_bonus
        reasons.append(f"Escalated due to waiting time ({int(waiting_time_minutes)} mins unassigned) (+{wait_bonus:.1f} pts)")

    # Clamp total score between 5.0 and 100.0
    final_score = round(min(100.0, max(5.0, score)), 1)

    # Classify severity
    if final_score >= 75.0:
        severity = "CRITICAL"
    elif final_score >= 45.0:
        severity = "HIGH"
    elif final_score >= 20.0:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    if not reasons:
        reasons.append("Standard baseline emergency assessment (+5 pts)")

    return final_score, severity, reasons
