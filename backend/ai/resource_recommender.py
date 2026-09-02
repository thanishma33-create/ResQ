import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models
import schemas

def recommend_resources(
    emergency_type: str,
    people_affected: int,
    injured_persons: int = 0,
    medical_required: bool = False,
    trapped: bool = False,
    severity: str = "MEDIUM",
    disaster_type: Optional[str] = None,
    db: Optional[Session] = None
) -> List[schemas.ResourceRecommendationItem]:
    """
    AI Resource Recommendation Engine.
    Calculates essential relief supplies needed for an emergency based on impact scale,
    demographics, injury levels, and disaster hazards. Checks available stock to identify shortages.
    Does NOT automatically lock/allocate stock.
    """
    people = max(1, people_affected)
    e_type = (emergency_type or "").lower()
    d_type = (disaster_type or "").lower()
    sev = (severity or "MEDIUM").upper()

    recommendations_dict: Dict[str, Dict[str, Any]] = {}

    # 1. Clean Drinking Water (4 Liters per person per day)
    water_qty = people * 4
    recommendations_dict["water"] = {
        "name": "Clean Drinking Water (Bottles/Liters)",
        "category": "water",
        "quantity": water_qty,
        "unit": "liters",
        "reason": f"Essential hydration for {people} person(s) (4L/person daily standard)"
    }

    # 2. Ready-to-Eat Food Packets (3 meals per person)
    food_qty = people * 3
    recommendations_dict["food"] = {
        "name": "Emergency Food Rations / Meal Packs",
        "category": "food",
        "quantity": food_qty,
        "unit": "packets",
        "reason": f"Nutritional sustainment for {people} person(s) for 24-48h"
    }

    # 3. First Aid Kits & Medical Supplies
    if medical_required or injured_persons > 0 or sev in ("HIGH", "CRITICAL"):
        fa_kits = max(1, math.ceil((injured_persons + 1) / 3))
        recommendations_dict["first_aid"] = {
            "name": "Emergency First Aid Kits",
            "category": "first_aid",
            "quantity": fa_kits,
            "unit": "kits",
            "reason": f"Immediate trauma & wound care for {injured_persons} injured / medical case(s)"
        }
        
        med_boxes = max(1, math.ceil(people / 4))
        recommendations_dict["medicine"] = {
            "name": "Essential Emergency Medicines & Antiseptics",
            "category": "medicine",
            "quantity": med_boxes,
            "unit": "boxes",
            "reason": "Vital medicines, rehydration salts, and disinfectants"
        }

    # 4. Ambulances
    if (injured_persons > 0 or medical_required) and sev in ("HIGH", "CRITICAL"):
        amb_needed = max(1, math.ceil(injured_persons / 2))
        recommendations_dict["ambulances"] = {
            "name": "Emergency Medical Ambulance",
            "category": "ambulances",
            "quantity": amb_needed,
            "unit": "vehicles",
            "reason": f"Critical patient transport for {injured_persons} casualty/medical cases"
        }

    # 5. Flood / Water specific (Boats & Life Jackets)
    is_water_disaster = "flood" in e_type or "flood" in d_type or "tsunami" in e_type or "tsunami" in d_type or "water" in e_type
    if is_water_disaster or (trapped and "flood" in d_type):
        recommendations_dict["life_jackets"] = {
            "name": "Safety Life Jackets",
            "category": "life_jackets",
            "quantity": people,
            "unit": "units",
            "reason": f"Flood water safety gear for {people} person(s)"
        }
        
        boats_needed = max(1, math.ceil(people / 6))
        recommendations_dict["boats"] = {
            "name": "Inflatable Rescue Boats",
            "category": "boats",
            "quantity": boats_needed,
            "unit": "boats",
            "reason": f"Waterborne evacuation capacity for {people} trapped person(s)"
        }

    # 6. Blankets & Warmth
    if sev in ("MEDIUM", "HIGH", "CRITICAL") or is_water_disaster or "landslide" in e_type or "cyclone" in d_type:
        blanket_qty = people
        recommendations_dict["blankets"] = {
            "name": "Thermal Blankets / Bedding",
            "category": "blankets",
            "quantity": blanket_qty,
            "unit": "units",
            "reason": f"Hypothermia prevention and comfort for {people} displaced individual(s)"
        }

    # 7. Heavy Rescue & Extraction Equipment
    if trapped or "landslide" in e_type or "earthquake" in d_type or "collapse" in e_type:
        rescue_kits = max(1, math.ceil(people / 5))
        recommendations_dict["rescue_equipment"] = {
            "name": "Heavy Debris & Extraction Equipment",
            "category": "rescue_equipment",
            "quantity": rescue_kits,
            "unit": "sets",
            "reason": "Specialized gear for clearing debris and extricating trapped persons"
        }

    # Query inventory to compute actual availability and shortages
    results: List[schemas.ResourceRecommendationItem] = []
    
    # Pre-fetch inventory if DB session provided
    available_stock_by_category: Dict[str, int] = {}
    if db:
        resources = db.query(models.Resource).all()
        for r in resources:
            cat = r.category.lower()
            available_stock_by_category[cat] = available_stock_by_category.get(cat, 0) + max(0, r.available_quantity)

    for cat_key, item in recommendations_dict.items():
        avail = available_stock_by_category.get(cat_key, 0)
        req = item["quantity"]
        shortage = max(0, req - avail)
        
        results.append(
            schemas.ResourceRecommendationItem(
                resource_name=item["name"],
                category=item["category"],
                recommended_quantity=req,
                unit=item["unit"],
                available_quantity=avail,
                shortage=shortage,
                reason=item["reason"]
            )
        )

    return results
