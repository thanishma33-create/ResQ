import datetime
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models
import schemas

KERALA_WEATHER_STATIONS = [
    {
        "location_name": "Thiruvananthapuram City",
        "latitude": 8.5241,
        "longitude": 76.9366,
        "base_temp": 29.5,
        "terrain": "coastal_urban"
    },
    {
        "location_name": "Nedumangad (Foothills)",
        "latitude": 8.6015,
        "longitude": 77.0016,
        "base_temp": 27.8,
        "terrain": "hilly"
    },
    {
        "location_name": "Neyyattinkara (River Basin)",
        "latitude": 8.4011,
        "longitude": 77.0863,
        "base_temp": 28.6,
        "terrain": "river_valley"
    },
    {
        "location_name": "Ponmudi (Western Ghats High Slopes)",
        "latitude": 8.7600,
        "longitude": 77.1167,
        "base_temp": 22.0,
        "terrain": "steep_hills"
    },
    {
        "location_name": "Varkala Coastal",
        "latitude": 8.7379,
        "longitude": 76.7163,
        "base_temp": 30.0,
        "terrain": "cliff_coast"
    }
]

def get_simulated_weather_report(location_name: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Generates realistic, modular weather and meteorological risk analysis for Kerala stations.
    Explicitly tags all simulated datasets for transparency with clean extension points for live APIs.
    """
    station = KERALA_WEATHER_STATIONS[0]
    if location_name:
        matched = next((s for s in KERALA_WEATHER_STATIONS if location_name.lower() in s["location_name"].lower()), None)
        if matched:
            station = matched

    # Realistic simulated parameters
    rainfall = round(random.uniform(45.0, 135.0), 1)
    temp = round(station["base_temp"] + random.uniform(-1.5, 1.5), 1)
    wind = round(random.uniform(20.0, 58.0), 1)
    
    # Compute Flood Risk
    if rainfall > 110.0 or (rainfall > 70.0 and station["terrain"] in ("river_valley", "coastal_urban")):
        flood_risk = "SEVERE" if rainfall > 120.0 else "HIGH"
    elif rainfall > 50.0:
        flood_risk = "MEDIUM"
    else:
        flood_risk = "LOW"

    # Compute Landslide Risk
    if station["terrain"] in ("steep_hills", "hilly"):
        if rainfall > 90.0:
            landslide_risk = "SEVERE"
        elif rainfall > 55.0:
            landslide_risk = "HIGH"
        else:
            landslide_risk = "MEDIUM"
    else:
        landslide_risk = "LOW"

    # Determine Alert Level
    if flood_risk == "SEVERE" or landslide_risk == "SEVERE":
        alert_level = "EMERGENCY"
        condition = "Heavy Monsoon Downpour / Severe Flash Flood Risk"
    elif flood_risk == "HIGH" or landslide_risk == "HIGH":
        alert_level = "WARNING"
        condition = "Torrential Rainfall & Squally Winds"
    elif flood_risk == "MEDIUM":
        alert_level = "WATCH"
        condition = "Moderate to Heavy Intermittent Rain"
    else:
        alert_level = "ADVISORY"
        condition = "Light Rain with Overcast Skies"

    return {
        "location_name": station["location_name"],
        "latitude": station["latitude"],
        "longitude": station["longitude"],
        "weather_condition": condition,
        "temperature": temp,
        "rainfall_mm": rainfall,
        "wind_speed_kmh": wind,
        "flood_risk": flood_risk,
        "landslide_risk": landslide_risk,
        "cyclone_risk": "MEDIUM" if wind > 50.0 else "LOW",
        "alert_level": alert_level,
        "description": f"Simulated meteorological observation for {station['location_name']}. Precipitation: {rainfall}mm/24h. Saturated soil conditions and runoff elevation observed.",
        "is_simulated": True,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

def generate_weather_alerts_if_needed(db: Session) -> List[models.WeatherAlert]:
    """Generates initial baseline simulated weather alerts if table is empty."""
    existing = db.query(models.WeatherAlert).count()
    if existing > 0:
        return db.query(models.WeatherAlert).all()

    created_alerts = []
    for station in KERALA_WEATHER_STATIONS:
        data = get_simulated_weather_report(location_name=station["location_name"])
        alert = models.WeatherAlert(
            location_name=data["location_name"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            weather_condition=data["weather_condition"],
            temperature=data["temperature"],
            rainfall_mm=data["rainfall_mm"],
            wind_speed_kmh=data["wind_speed_kmh"],
            flood_risk=data["flood_risk"],
            landslide_risk=data["landslide_risk"],
            cyclone_risk=data["cyclone_risk"],
            alert_level=data["alert_level"],
            description=data["description"],
            is_simulated=True,
            issued_at=datetime.datetime.utcnow(),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        )
        db.add(alert)
        created_alerts.append(alert)

    db.commit()
    return created_alerts
