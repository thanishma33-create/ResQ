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
                "name": "Monsoon Flash Flood - Karamana River Basin",
                "type": "flood",
                "description": "Intense torrential monsoon precipitation causing rapid water level rise and inundation in low-lying riverside communities.",
                "affected_area": "Karamana, Maruthankuzhy, Jagathy & Attukal",
                "latitude": 8.4862,
                "longitude": 76.9634,
                "risk_level": "high",
                "is_active": True
            },
            {
                "name": "Western Ghats Landslide Threat - Ponmudi Hills",
                "type": "landslide",
                "description": "Continuous downpours causing soil saturation and slope failure risks along Ponmudi mountain passes.",
                "affected_area": "Ponmudi, Vithura & Kallar",
                "latitude": 8.7600,
                "longitude": 77.1167,
                "risk_level": "critical",
                "is_active": True
            },
            {
                "name": "Periyar River Inundation & Industrial Zone Surge - Kochi",
                "type": "flood",
                "description": "High tide backwater surge and heavy reservoir discharge flooding coastal and low-lying urban pockets of Ernakulam and Kochi.",
                "affected_area": "Marine Drive, Fort Kochi, Kakkanad & Aluva",
                "latitude": 9.9312,
                "longitude": 76.2673,
                "risk_level": "high",
                "is_active": True
            },
            {
                "name": "Ashtamudi Lake Coastal Surge & Estuary Alert - Kollam",
                "type": "flood",
                "description": "Heavy sea-swell and lake overflow threatening coastal fishing villages and low-lying wetlands.",
                "affected_area": "Kollam Beach, Chinnakada & Ashramam",
                "latitude": 8.8932,
                "longitude": 76.6141,
                "risk_level": "medium",
                "is_active": True
            },
            {
                "name": "Kuttanad Lowland Submergence - Alappuzha",
                "type": "flood",
                "description": "Severe waterlogging across below-sea-level paddy wetlands and water corridors in Kuttanad basin.",
                "affected_area": "Kuttanad, Alappuzha Town & Champakulam",
                "latitude": 9.4981,
                "longitude": 76.3388,
                "risk_level": "high",
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
        print("[INFO] Seeding response teams across regions...")
        teams_data = [
            # Thiruvananthapuram Teams
            {
                "name": "NDRF Unit 04 - Flood & Marine Rescue",
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
                "base_location": "Chenthitta Fire HQ, Thiruvananthapuram",
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
                "base_location": "General Hospital Base, Thiruvananthapuram",
                "status": "AVAILABLE",
                "max_capacity": 10
            },
            # Kochi / Ernakulam Teams
            {
                "name": "Kochi Coastal & Harbour Rescue Squad",
                "team_leader": "Commander Vivek S.",
                "contact_phone": "+91 94472 00201",
                "specialty": "boat_rescue",
                "latitude": 9.9312,
                "longitude": 76.2673,
                "base_location": "Marine Drive Jetty, Kochi",
                "status": "AVAILABLE",
                "max_capacity": 14
            },
            {
                "name": "Ernakulam Emergency Rapid Action Team",
                "team_leader": "Officer George Mathew",
                "contact_phone": "+91 94472 00202",
                "specialty": "search_rescue",
                "latitude": 9.9816,
                "longitude": 76.2999,
                "base_location": "Kaloor Fire Station, Kochi",
                "status": "AVAILABLE",
                "max_capacity": 12
            },
            # Kollam Teams
            {
                "name": "Kollam Port Marine Disaster Response Force",
                "team_leader": "Capt. Harikumar",
                "contact_phone": "+91 94473 00301",
                "specialty": "boat_rescue",
                "latitude": 8.8932,
                "longitude": 76.6141,
                "base_location": "Port Operations Command, Kollam",
                "status": "AVAILABLE",
                "max_capacity": 10
            },
            {
                "name": "Kollam Civil Defense Rescue Unit",
                "team_leader": "Insp. Abdul Rasheed",
                "contact_phone": "+91 94473 00302",
                "specialty": "general_rescue",
                "latitude": 8.8856,
                "longitude": 76.5864,
                "base_location": "Beach Road Station, Kollam",
                "status": "AVAILABLE",
                "max_capacity": 8
            },
            # Alappuzha Teams
            {
                "name": "Alappuzha Water Ambulance & Lowland Squad",
                "team_leader": "Capt. Somanath P.",
                "contact_phone": "+91 94474 00401",
                "specialty": "flood_rescue",
                "latitude": 9.4981,
                "longitude": 76.3388,
                "base_location": "Finishing Point Boat Jetty, Alappuzha",
                "status": "AVAILABLE",
                "max_capacity": 12
            }
        ]

        for t in teams_data:
            if not db.query(models.RescueTeam).filter(models.RescueTeam.name == t["name"]).first():
                team = models.RescueTeam(**t)
                db.add(team)
                db.commit()

        # 4. VOLUNTEERS
        print("[INFO] Seeding volunteer network across regions...")
        volunteers_data = [
            # Trivandrum Volunteers
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
                "address": "Karamana River Road, Thiruvananthapuram",
                "availability": "AVAILABLE",
                "rating": 5.0
            },
            # Kochi Volunteers
            {
                "name": "Deepak Menon",
                "email": "deepak.m@resq.org",
                "phone": "+91 98470 22001",
                "skills": json.dumps(["driving", "search_rescue", "boat_driving"]),
                "latitude": 9.9320,
                "longitude": 76.2680,
                "address": "Marine Drive Walkway, Kochi",
                "availability": "AVAILABLE",
                "rating": 4.9
            },
            {
                "name": "Dr. Archana Pillai",
                "email": "archana.p@resq.org",
                "phone": "+91 98470 22002",
                "skills": json.dumps(["medical", "first_aid", "trauma_care"]),
                "latitude": 9.9820,
                "longitude": 76.3010,
                "address": "Kaloor-Kadavanthra Road, Kochi",
                "availability": "AVAILABLE",
                "rating": 5.0
            },
            # Kollam Volunteers
            {
                "name": "Bipin Chandran",
                "email": "bipin.c@resq.org",
                "phone": "+91 98470 33001",
                "skills": json.dumps(["logistics", "food_distribution"]),
                "latitude": 8.8920,
                "longitude": 76.6130,
                "address": "Ashramam, Kollam",
                "availability": "AVAILABLE",
                "rating": 4.8
            },
            # Alappuzha Volunteers
            {
                "name": "Jithin Thomas",
                "email": "jithin.t@resq.org",
                "phone": "+91 98470 44001",
                "skills": json.dumps(["boat_rescue", "swimming", "first_aid"]),
                "latitude": 9.4990,
                "longitude": 76.3370,
                "address": "Finishing Point Road, Alappuzha",
                "availability": "AVAILABLE",
                "rating": 4.9
            }
        ]

        for v in volunteers_data:
            if not db.query(models.Volunteer).filter(models.Volunteer.name == v["name"]).first():
                vol = models.Volunteer(**v)
                db.add(vol)
                db.commit()

        # 5. RESOURCES
        print("[INFO] Seeding resource inventory across regions...")
        resources_data = [
            # Thiruvananthapuram Resources
            {
                "name": "Clean Bottled Drinking Water (TVM)",
                "category": "water",
                "unit": "liters",
                "total_quantity": 10000,
                "available_quantity": 9200,
                "allocated_quantity": 800,
                "latitude": 8.5241,
                "longitude": 76.9366,
                "location_name": "Central Palayam Disaster Depot, Thiruvananthapuram"
            },
            {
                "name": "Emergency Ready-to-Eat Meal Rations (TVM)",
                "category": "food",
                "unit": "packets",
                "total_quantity": 6000,
                "available_quantity": 5400,
                "allocated_quantity": 600,
                "latitude": 8.5241,
                "longitude": 76.9366,
                "location_name": "Central Palayam Disaster Depot, Thiruvananthapuram"
            },
            {
                "name": "Trauma & Emergency First Aid Kits (TVM)",
                "category": "first_aid",
                "unit": "kits",
                "total_quantity": 400,
                "available_quantity": 370,
                "allocated_quantity": 30,
                "latitude": 8.5200,
                "longitude": 76.9400,
                "location_name": "Medical College Health Depot, Thiruvananthapuram"
            },
            {
                "name": "Motorized Inflatable Rescue Boats (Varkala)",
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
                "name": "Heavy Thermal Blankets & Bedding (TVM)",
                "category": "blankets",
                "unit": "units",
                "total_quantity": 2500,
                "available_quantity": 2200,
                "allocated_quantity": 300,
                "latitude": 8.5085,
                "longitude": 76.9538,
                "location_name": "Chenthitta Relief Logistics Center, Thiruvananthapuram"
            },
            # Kochi / Ernakulam Resources
            {
                "name": "Drinking Water Supply Reserve (Kochi)",
                "category": "water",
                "unit": "liters",
                "total_quantity": 8000,
                "available_quantity": 7500,
                "allocated_quantity": 500,
                "latitude": 9.9312,
                "longitude": 76.2673,
                "location_name": "Ernakulam Marine Center Depot, Kochi"
            },
            {
                "name": "Emergency Food Rations Packets (Kochi)",
                "category": "food",
                "unit": "packets",
                "total_quantity": 5000,
                "available_quantity": 4600,
                "allocated_quantity": 400,
                "latitude": 9.9312,
                "longitude": 76.2673,
                "location_name": "Ernakulam Marine Center Depot, Kochi"
            },
            {
                "name": "Water Rescue Inflatable Boats (Kochi)",
                "category": "boats",
                "unit": "boats",
                "total_quantity": 15,
                "available_quantity": 12,
                "allocated_quantity": 3,
                "latitude": 9.9340,
                "longitude": 76.2650,
                "location_name": "Fort Kochi Coastal Depot"
            },
            {
                "name": "Safety Life Jackets Marine (Kochi)",
                "category": "life_jackets",
                "unit": "units",
                "total_quantity": 600,
                "available_quantity": 550,
                "allocated_quantity": 50,
                "latitude": 9.9340,
                "longitude": 76.2650,
                "location_name": "Fort Kochi Coastal Depot"
            },
            {
                "name": "Emergency Medical Aid & Antibiotics (Kochi)",
                "category": "medicine",
                "unit": "boxes",
                "total_quantity": 350,
                "available_quantity": 320,
                "allocated_quantity": 30,
                "latitude": 9.9816,
                "longitude": 76.2999,
                "location_name": "Kaloor Health Supply Store, Kochi"
            },
            # Kollam Resources
            {
                "name": "Potable Water Emergency Cans (Kollam)",
                "category": "water",
                "unit": "liters",
                "total_quantity": 6000,
                "available_quantity": 5800,
                "allocated_quantity": 200,
                "latitude": 8.8932,
                "longitude": 76.6141,
                "location_name": "Chinnakada Disaster Warehouse, Kollam"
            },
            {
                "name": "Relief Meal Packs & Nutrition (Kollam)",
                "category": "food",
                "unit": "packets",
                "total_quantity": 4000,
                "available_quantity": 3800,
                "allocated_quantity": 200,
                "latitude": 8.8932,
                "longitude": 76.6141,
                "location_name": "Chinnakada Disaster Warehouse, Kollam"
            },
            {
                "name": "Coastal Rescue Life Jackets (Kollam)",
                "category": "life_jackets",
                "unit": "units",
                "total_quantity": 450,
                "available_quantity": 420,
                "allocated_quantity": 30,
                "latitude": 8.8856,
                "longitude": 76.5864,
                "location_name": "Kollam Port Storage Hub"
            },
            # Alappuzha Resources
            {
                "name": "Flood Zone Clean Drinking Water (Alappuzha)",
                "category": "water",
                "unit": "liters",
                "total_quantity": 7000,
                "available_quantity": 6400,
                "allocated_quantity": 600,
                "latitude": 9.4981,
                "longitude": 76.3388,
                "location_name": "Alappuzha Town Relief Depot"
            },
            {
                "name": "Kuttanad Inflatable Rescue Boats (Alappuzha)",
                "category": "boats",
                "unit": "boats",
                "total_quantity": 18,
                "available_quantity": 15,
                "allocated_quantity": 3,
                "latitude": 9.4981,
                "longitude": 76.3388,
                "location_name": "Finishing Point Depot, Alappuzha"
            }
        ]

        for r in resources_data:
            if not db.query(models.Resource).filter(models.Resource.name == r["name"]).first():
                res = models.Resource(**r)
                db.add(res)
                db.commit()

        # 6. SHELTERS
        print("[INFO] Seeding evacuation shelters across regions...")
        shelters_data = [
            # Thiruvananthapuram Shelters
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
            # Kochi Shelters
            {
                "name": "Kochi Marine Drive Community Evacuation Camp",
                "address": "Shanmugham Road, Marine Drive, Kochi",
                "latitude": 9.9325,
                "longitude": 76.2690,
                "capacity": 450,
                "occupied": 180,
                "available_capacity": 270,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "District Officer Suresh Nair",
                "contact_phone": "+91 94472 33441",
                "status": "OPEN"
            },
            {
                "name": "Ernakulam Town Hall Relief Shelter",
                "address": "Banerji Road, Kaloor, Kochi",
                "latitude": 9.9830,
                "longitude": 76.2980,
                "capacity": 300,
                "occupied": 90,
                "available_capacity": 210,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Mrs. Mini George",
                "contact_phone": "+91 94472 33442",
                "status": "OPEN"
            },
            # Kollam Shelters
            {
                "name": "Kollam Beachfront Relief Complex",
                "address": "Beach Road, Pallithottam, Kollam",
                "latitude": 8.8910,
                "longitude": 76.6120,
                "capacity": 400,
                "occupied": 150,
                "available_capacity": 250,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Mr. Shibu Kumar",
                "contact_phone": "+91 94473 44551",
                "status": "OPEN"
            },
            # Alappuzha Shelters
            {
                "name": "Alappuzha SDV Relief Camp",
                "address": "Near Canal Bridge, Alappuzha Town",
                "latitude": 9.4975,
                "longitude": 76.3380,
                "capacity": 350,
                "occupied": 140,
                "available_capacity": 210,
                "has_medical_facility": True,
                "has_food": True,
                "has_water": True,
                "has_electricity": True,
                "is_accessible": True,
                "contact_person": "Fr. Mathew Varghese",
                "contact_phone": "+91 94474 55661",
                "status": "OPEN"
            }
        ]

        for s in shelters_data:
            if not db.query(models.Shelter).filter(models.Shelter.name == s["name"]).first():
                shelter = models.Shelter(**s)
                db.add(shelter)
                db.commit()

        # 7. EMERGENCIES
        print("[INFO] Seeding emergency incidents across regions...")
        sample_emergencies = [
            # TVM Emergency
            {
                "emergency_type": "flood_trapped",
                "description": "6 family members trapped on terrace as Karamana river floodwaters reached ground floor. Need boat rescue.",
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
            # Kochi Emergency
            {
                "emergency_type": "flood_trapped",
                "description": "4 residents trapped near waterfront promenade in Kochi due to backwater surge and high tide. Requesting evacuation.",
                "latitude": 9.9315,
                "longitude": 76.2675,
                "address": "Marine Drive Promenade, Kochi",
                "people_affected": 4,
                "children": 1,
                "elderly": 1,
                "pregnant_persons": 0,
                "disabled_persons": 0,
                "injured_persons": 0,
                "medical_required": False,
                "trapped": True,
                "required_resources": ["boats", "life_jackets"],
                "disaster_id": created_disasters[2].id,
                "reporter_name": "Antony Joseph",
                "reporter_phone": "+91 94472 99882",
                "status": "PENDING"
            },
            # Kollam Emergency
            {
                "emergency_type": "sos_distress",
                "description": "URGENT SOS: Fishing family isolated in rising water near Ashtamudi lakeside.",
                "latitude": 8.8935,
                "longitude": 76.6145,
                "address": "Ashramam Lakefront, Kollam",
                "people_affected": 3,
                "children": 0,
                "elderly": 1,
                "pregnant_persons": 0,
                "disabled_persons": 0,
                "injured_persons": 0,
                "medical_required": False,
                "trapped": True,
                "required_resources": ["boats", "life_jackets"],
                "disaster_id": created_disasters[3].id,
                "reporter_name": "Raghavan K.",
                "reporter_phone": "+91 94473 99883",
                "status": "PENDING"
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

        print("[SUCCESS] Database successfully seeded with realistic multi-region Kerala disaster response data!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
