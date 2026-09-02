import os
import json
import datetime
from sqlalchemy.orm import Session

from config import settings
from database import engine, SessionLocal, Base, ensure_db_schema
import models
from auth import get_password_hash
from ai.priority_engine import calculate_priority_score
from services.incident_history_service import log_incident_event

def seed_database():
    """Idempotently seeds realistic disaster relief test data for Kerala / Thiruvananthapuram."""
    print("[INFO] Initializing database schema and ensuring offline sync columns...")
    ensure_db_schema()
    db: Session = SessionLocal()

    try:
        # 1. USERS
        print("[INFO] Seeding default user accounts...")
        users_data = [
            {
                "username": settings.ADMIN_USERNAME,
                "email": settings.ADMIN_EMAIL,
                "password": settings.ADMIN_PASSWORD,
                "full_name": "ResQ Operations Director",
                "role": "admin",
                "phone": "+91 98765 43210"
            },
            {
                "username": "operator",
                "email": "operator@resq.org",
                "password": "Operator@123",
                "full_name": "Kerala Disaster Command Operator",
                "role": "operator",
                "phone": "+91 98765 43211"
            },
            {
                "username": "citizen",
                "email": "citizen@resq.org",
                "password": "Citizen@123",
                "full_name": "Suresh Kumar",
                "role": "citizen",
                "phone": "+91 98765 43212"
            },
            {
                "username": "rescue_lead",
                "email": "team@resq.org",
                "password": "Team@123",
                "full_name": "Capt. Rajesh Nair (NDRF Lead)",
                "role": "rescue_team",
                "phone": "+91 98765 43213"
            },
            {
                "username": "volunteer1",
                "email": "volunteer@resq.org",
                "password": "Volunteer@123",
                "full_name": "Dr. Ananya Nair",
                "role": "volunteer",
                "phone": "+91 98765 43214"
            }
        ]

        created_users = {}
        for u in users_data:
            existing = db.query(models.User).filter(models.User.username == u["username"]).first()
            if not existing:
                user = models.User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    phone=u["phone"],
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                created_users[u["username"]] = user
            else:
                created_users[u["username"]] = existing

        # 2. DISASTER EVENTS
        print("[INFO] Seeding active disaster events...")
        disasters_data = [
            {
                "name": "Monsoon Flash Flood – Karamana River Basin",
                "type": "flood",
                "description": "Intense torrential monsoon precipitation causing rapid water level rise and inundation in low-lying riverside communities.",
                "affected_area": "Karamana, Maruthankuzhy, Jagathy & Attukal",
                "latitude": 8.4862,
                "longitude": 76.9634,
                "risk_level": "high",
                "is_active": True
            },
            {
                "name": "Western Ghats Landslide Threat – Ponmudi Hills",
                "type": "landslide",
                "description": "Continuous downpours causing soil saturation and slope failure risks along Ponmudi mountain passes.",
                "affected_area": "Ponmudi, Vithura & Kallar",
                "latitude": 8.7600,
                "longitude": 77.1167,
                "risk_level": "critical",
                "is_active": True
            }
        ]

        created_disasters = []
        for d in disasters_data:
            existing = db.query(models.DisasterEvent).filter(models.DisasterEvent.name == d["name"]).first()
            if not existing:
                disaster = models.DisasterEvent(**d)
                db.add(disaster)
                db.commit()
                db.refresh(disaster)
                created_disasters.append(disaster)
            else:
                created_disasters.append(existing)

        # 3. RESCUE TEAMS
        print("[INFO] Seeding response teams...")
        teams_data = [
            {
                "name": "NDRF Unit 04 – Flood & Marine Rescue",
                "team_leader": "Capt. Rajesh Nair",
                "contact_phone": "+91 94471 00101",
                "specialty": "flood_rescue",
                "latitude": 8.5241,
                "longitude": 76.9366,
                "base_location": "Palayam Central Camp, Thiruvananthapuram",
                "status": "AVAILABLE",
                "max_capacity": 15,
                "user_id": created_users["rescue_lead"].id
            },
            {
                "name": "Kerala Fire & Rescue Quick Response Unit",
                "team_leader": "Station Officer Manoj V.",
                "contact_phone": "+91 94471 00102",
                "specialty": "search_rescue",
                "latitude": 8.5085,
                "longitude": 76.9538,
                "base_location": "Chenthitta Fire HQ",
                "status": "AVAILABLE",
                "max_capacity": 12
            },
            {
                "name": "Coastal Marine Disaster Evacuation Squad",
                "team_leader": "Sub-Inspector Joy Thomas",
                "contact_phone": "+91 94471 00103",
                "specialty": "boat_rescue",
                "latitude": 8.7379,
                "longitude": 76.7163,
                "base_location": "Varkala Coastal Station",
                "status": "AVAILABLE",
                "max_capacity": 8
            },
            {
                "name": "District Mobile Trauma & Medical Response Unit",
                "team_leader": "Dr. Pradeep George",
                "contact_phone": "+91 94471 00104",
                "specialty": "medical",
                "latitude": 8.5200,
                "longitude": 76.9400,
                "base_location": "General Hospital Base",
                "status": "AVAILABLE",
                "max_capacity": 10
            }
        ]

        for t in teams_data:
            if not db.query(models.RescueTeam).filter(models.RescueTeam.name == t["name"]).first():
                team = models.RescueTeam(**t)
                db.add(team)
                db.commit()

        # 4. VOLUNTEERS
        print("[INFO] Seeding volunteer network...")
        volunteers_data = [
            {
                "name": "Dr. Ananya Nair",
                "email": "ananya.nair@resq.org",
                "phone": "+91 98470 11001",
                "skills": json.dumps(["medical", "first_aid"]),
                "latitude": 8.5120,
                "longitude": 76.9450,
                "address": "Statue Junction, Thiruvananthapuram",
                "availability": "AVAILABLE",
                "user_id": created_users["volunteer1"].id,
                "rating": 4.9
            },
            {
                "name": "Rahul Krishnan",
                "email": "rahul.k@resq.org",
                "phone": "+91 98470 11002",
                "skills": json.dumps(["driving", "search_rescue"]),
                "latitude": 8.5350,
                "longitude": 76.9200,
                "address": "Pattom, Thiruvananthapuram",
                "availability": "AVAILABLE",
                "rating": 4.8
            },
            {
                "name": "Reshma Joseph",
                "email": "reshma.j@resq.org",
                "phone": "+91 98470 11003",
                "skills": json.dumps(["food_distribution", "logistics"]),
                "latitude": 8.4980,
                "longitude": 76.9700,
                "address": "Karamana River Road",
                "availability": "AVAILABLE",
                "rating": 5.0
            },
            {
                "name": "Vishnu Prasad",
                "email": "vishnu.p@resq.org",
                "phone": "+91 98470 11004",
                "skills": json.dumps(["search_rescue", "driving"]),
                "latitude": 8.4800,
                "longitude": 76.9500,
                "address": "Thiruvallam",
                "availability": "AVAILABLE",
                "rating": 4.7
            },
            {
                "name": "Meera Varma",
                "email": "meera.v@resq.org",
                "phone": "+91 98470 11005",
                "skills": json.dumps(["communication", "translation", "medical"]),
                "latitude": 8.5400,
                "longitude": 76.9600,
                "address": "Sasthamangalam",
                "availability": "AVAILABLE",
                "rating": 4.9
            },
            {
                "name": "Arun Kumar",
                "email": "arun.k@resq.org",
                "phone": "+91 98470 11006",
                "skills": json.dumps(["first_aid", "food_distribution"]),
                "latitude": 8.5050,
                "longitude": 76.9300,
                "address": "Manacaud",
                "availability": "AVAILABLE",
                "rating": 4.6
            }
        ]

        for v in volunteers_data:
            if not db.query(models.Volunteer).filter(models.Volunteer.name == v["name"]).first():
                vol = models.Volunteer(**v)
                db.add(vol)
                db.commit()

        # 5. RESOURCES
        print("[INFO] Seeding resource inventory...")
        resources_data = [
            {
                "name": "Clean Bottled Drinking Water",
                "category": "water",
                "unit": "liters",
                "total_quantity": 10000,
                "available_quantity": 9200,
                "allocated_quantity": 800,
                "latitude": 8.5241,
                "longitude": 76.9366,
                "location_name": "Central Palayam Disaster Depot"
            },
            {
                "name": "Emergency Ready-to-Eat Meal Rations",
                "category": "food",
                "unit": "packets",
                "total_quantity": 6000,
                "available_quantity": 5400,
                "allocated_quantity": 600,
                "latitude": 8.5241,
                "longitude": 76.9366,
                "location_name": "Central Palayam Disaster Depot"
            },
            {
                "name": "Trauma & Emergency First Aid Kits",
                "category": "first_aid",
                "unit": "kits",
                "total_quantity": 400,
                "available_quantity": 370,
                "allocated_quantity": 30,
                "latitude": 8.5200,
                "longitude": 76.9400,
                "location_name": "Medical College Health Depot"
            },
            {
                "name": "Motorized Inflatable Rescue Boats",
                "category": "boats",
                "unit": "boats",
                "total_quantity": 20,
                "available_quantity": 18,
                "allocated_quantity": 2,
                "latitude": 8.7379,
                "longitude": 76.7163,
                "location_name": "Varkala Coastal Command"
            },
            {
                "name": "Safety Life Jackets (Adult & Child)",
                "category": "life_jackets",
                "unit": "units",
                "total_quantity": 800,
                "available_quantity": 740,
                "allocated_quantity": 60,
                "latitude": 8.7379,
                "longitude": 76.7163,
                "location_name": "Varkala Coastal Command"
            },
            {
                "name": "Heavy Thermal Blankets & Bedding",
                "category": "blankets",
                "unit": "units",
                "total_quantity": 2500,
                "available_quantity": 2200,
                "allocated_quantity": 300,
                "latitude": 8.5085,
                "longitude": 76.9538,
                "location_name": "Chenthitta Relief Logistics Center"
            },
            {
                "name": "Hydraulic Debris Spreaders & Chainsaws",
                "category": "rescue_equipment",
                "unit": "sets",
                "total_quantity": 30,
                "available_quantity": 28,
                "allocated_quantity": 2,
                "latitude": 8.5085,
                "longitude": 76.9538,
                "location_name": "Chenthitta Fire Depot"
            },
            {
                "name": "Essential Emergency Medicines & Antibiotics",
                "category": "medicine",
                "unit": "boxes",
                "total_quantity": 500,
                "available_quantity": 480,
                "allocated_quantity": 20,
                "latitude": 8.5200,
                "longitude": 76.9400,
                "location_name": "District Health Store"
            }
        ]

        for r in resources_data:
            if not db.query(models.Resource).filter(models.Resource.name == r["name"]).first():
                res = models.Resource(**r)
                db.add(res)
                db.commit()

        # 6. SHELTERS
        print("[INFO] Seeding evacuation shelters...")
        shelters_data = [
            {
                "name": "Government Model Higher Secondary School Relief Camp",
                "address": "Thycaud, Palayam, Thiruvananthapuram",
                "latitude": 8.5000,
                "longitude": 76.9500,
                "capacity": 350,
                "occupied": 160,
                "available_capacity": 190,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Principal Radhakrishnan",
                "contact_phone": "+91 94471 22331",
                "status": "OPEN"
            },
            {
                "name": "Neyyattinkara Municipal Community Shelter",
                "address": "Hospital Road, Neyyattinkara",
                "latitude": 8.4011,
                "longitude": 77.0863,
                "capacity": 250,
                "occupied": 195,
                "available_capacity": 55,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Councilor Binu Thomas",
                "contact_phone": "+91 94471 22332",
                "status": "OPEN"
            },
            {
                "name": "Nedumangad Town Evacuation Camp",
                "address": "Near KSRTC Depot, Nedumangad",
                "latitude": 8.6015,
                "longitude": 77.0016,
                "capacity": 200,
                "occupied": 75,
                "available_capacity": 125,
                "has_medical_facility": False,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Smt. Shailaja Teacher",
                "contact_phone": "+91 94471 22333",
                "status": "OPEN"
            },
            {
                "name": "Kazhakkoottam Indoor Stadium Shelter",
                "address": "Technopark Phase 1 Bypass, Kazhakkoottam",
                "latitude": 8.5583,
                "longitude": 76.8783,
                "capacity": 500,
                "occupied": 230,
                "available_capacity": 270,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Capt. Santhosh Kumar",
                "contact_phone": "+91 94471 22334",
                "status": "OPEN"
            },
            {
                "name": "Varkala Cliffside Disaster Refuge",
                "address": "Helipad Road, North Cliff, Varkala",
                "latitude": 8.7379,
                "longitude": 76.7163,
                "capacity": 150,
                "occupied": 30,
                "available_capacity": 120,
                "has_medical_facility": False,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Mr. Salim Varkala",
                "contact_phone": "+91 94471 22335",
                "status": "OPEN"
            }
        ]

        for s in shelters_data:
            if not db.query(models.Shelter).filter(models.Shelter.name == s["name"]).first():
                shelter = models.Shelter(**s)
                db.add(shelter)
                db.commit()

        # 7. EMERGENCIES
        print("[INFO] Seeding emergency incidents with AI Priority scoring...")
        sample_emergencies = [
            {
                "emergency_type": "flood_trapped",
                "description": "6 family members trapped on terrace as Karamana river floodwaters reached 8ft ground floor depth. 2 children and 1 elderly person need boat rescue.",
                "latitude": 8.4890,
                "longitude": 76.9620,
                "address": "House #42, Maruthankuzhy Riverview, Thiruvananthapuram",
                "people_affected": 6,
                "children": 2,
                "elderly": 1,
                "pregnant_persons": 0,
                "disabled_persons": 0,
                "injured_persons": 0,
                "medical_required": False,
                "trapped": True,
                "required_resources": ["boats", "life_jackets", "food"],
                "disaster_id": created_disasters[0].id,
                "reporter_name": "Gopalakrishnan Pillai",
                "reporter_phone": "+91 94470 99881",
                "status": "VERIFIED"
            },
            {
                "emergency_type": "landslide_collapse",
                "description": "Severe hillside mudslide partially buried residential building. 2 persons injured with bone fractures, 1 elderly person trapped in rear room.",
                "latitude": 8.7580,
                "longitude": 77.1140,
                "address": "Tea Estate Quarters, Ponmudi Lower Ghats",
                "people_affected": 4,
                "children": 0,
                "elderly": 1,
                "pregnant_persons": 0,
                "disabled_persons": 0,
                "injured_persons": 2,
                "medical_required": True,
                "trapped": True,
                "required_resources": ["ambulances", "rescue_equipment", "first_aid"],
                "disaster_id": created_disasters[1].id,
                "reporter_name": "Mani K.",
                "reporter_phone": "+91 94470 99882",
                "status": "ASSIGNED"
            },
            {
                "emergency_type": "medical_emergency",
                "description": "Pregnant mother in advanced labor isolated due to washed-away culvert and inundated access road.",
                "latitude": 8.6100,
                "longitude": 77.0100,
                "address": "Valiyavila Road, Nedumangad",
                "people_affected": 2,
                "children": 0,
                "elderly": 0,
                "pregnant_persons": 1,
                "disabled_persons": 0,
                "injured_persons": 0,
                "medical_required": True,
                "trapped": True,
                "required_resources": ["ambulances", "first_aid"],
                "reporter_name": "Sunil Varghese",
                "reporter_phone": "+91 94470 99883",
                "status": "PENDING"
            },
            {
                "emergency_type": "food_water_shortage",
                "description": "Group of 12 migrant laborers in waterlogged relief settlement lacking food and potable drinking water for 36 hours.",
                "latitude": 8.4100,
                "longitude": 77.0800,
                "address": "Brick Kiln Settlement, Neyyattinkara",
                "people_affected": 12,
                "children": 3,
                "elderly": 0,
                "pregnant_persons": 0,
                "disabled_persons": 1,
                "injured_persons": 0,
                "medical_required": False,
                "trapped": False,
                "required_resources": ["food", "water", "blankets"],
                "reporter_name": "Babu Roy",
                "reporter_phone": "+91 94470 99884",
                "status": "PENDING"
            },
            {
                "emergency_type": "sos_distress",
                "description": "URGENT SOS: Vehicle caught in flash flood on Attukal bypass. Rapidly rising current.",
                "latitude": 8.4720,
                "longitude": 76.9550,
                "address": "Attukal Temple Bridge Approach Road",
                "people_affected": 3,
                "children": 1,
                "elderly": 0,
                "pregnant_persons": 0,
                "disabled_persons": 0,
                "injured_persons": 0,
                "medical_required": False,
                "trapped": True,
                "required_resources": ["boats", "life_jackets"],
                "reporter_name": "Vinod S.",
                "reporter_phone": "+91 94470 99885",
                "status": "EN_ROUTE"
            }
        ]

        for e_data in sample_emergencies:
            existing = db.query(models.Emergency).filter(models.Emergency.address == e_data["address"]).first()
            if not existing:
                score, severity, reasons = calculate_priority_score(
                    people_affected=e_data["people_affected"],
                    injured_persons=e_data["injured_persons"],
                    medical_required=e_data["medical_required"],
                    trapped=e_data["trapped"],
                    children=e_data["children"],
                    elderly=e_data["elderly"],
                    pregnant_persons=e_data["pregnant_persons"],
                    disabled_persons=e_data["disabled_persons"],
                    disaster_risk_level="high"
                )

                em = models.Emergency(
                    emergency_type=e_data["emergency_type"],
                    description=e_data["description"],
                    latitude=e_data["latitude"],
                    longitude=e_data["longitude"],
                    address=e_data["address"],
                    people_affected=e_data["people_affected"],
                    children=e_data["children"],
                    elderly=e_data["elderly"],
                    pregnant_persons=e_data["pregnant_persons"],
                    disabled_persons=e_data["disabled_persons"],
                    injured_persons=e_data["injured_persons"],
                    medical_required=e_data["medical_required"],
                    trapped=e_data["trapped"],
                    required_resources=json.dumps(e_data["required_resources"]),
                    severity=severity,
                    priority_score=score,
                    priority_reasons=json.dumps(reasons),
                    status=e_data["status"],
                    disaster_id=e_data.get("disaster_id"),
                    reporter_name=e_data["reporter_name"],
                    reporter_phone=e_data["reporter_phone"]
                )
                db.add(em)
                db.commit()
                db.refresh(em)

                log_incident_event(
                    db=db,
                    emergency_id=em.id,
                    event_type="CREATED",
                    description=f"Emergency initialized in seed data. Severity: {severity}, Score: {score}",
                    actor_name="System Seed"
                )

        # 8. EMERGENCY BROADCASTS
        print("[INFO] Seeding emergency broadcast...")
        if not db.query(models.EmergencyBroadcast).first():
            broadcast = models.EmergencyBroadcast(
                title="RED ALERT: Karamana River Basin Overflow",
                message="Residents within 500m of Karamana River are advised to evacuate to designated government shelters immediately due to heavy dam discharge.",
                severity="CRITICAL",
                target_area="Thiruvananthapuram District - Low lying river zones",
                latitude=8.4862,
                longitude=76.9634,
                radius_km=10.0,
                is_active=True,
                created_by_user_id=created_users["admin"].id
            )
            db.add(broadcast)
            db.commit()

        print("[SUCCESS] Database successfully seeded with realistic Kerala disaster response data!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
