import math
from typing import List, Tuple, Dict, Any, Optional

EARTH_RADIUS_KM = 6371.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth's surface
    using the Haversine formula. Returns distance in Kilometers.
    """
    try:
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(EARTH_RADIUS_KM * c, 2)
    except Exception:
        return 0.0

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the distance between two coordinates in meters."""
    return round(haversine_distance(lat1, lon1, lat2, lon2) * 1000.0, 1)

def is_point_in_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_km: float) -> bool:
    """Checks if point 2 is within radius_km of point 1."""
    return haversine_distance(lat1, lon1, lat2, lon2) <= radius_km

def estimate_eta_minutes(distance_km: float, speed_kmh: float = 40.0, urban_delay_factor: float = 1.25) -> float:
    """
    Estimates arrival time in minutes given distance in km and average vehicle speed.
    Urban delay factor accounts for traffic, debris, and road conditions in disaster areas.
    """
    if distance_km <= 0 or speed_kmh <= 0:
        return 0.0
    raw_hours = distance_km / speed_kmh
    estimated_minutes = raw_hours * 60.0 * urban_delay_factor
    return round(max(estimated_minutes, 1.0), 1)

def sort_by_distance(origin_lat: float, origin_lon: float, items: List[Any], lat_attr: str = "latitude", lon_attr: str = "longitude") -> List[Tuple[Any, float]]:
    """
    Sorts a list of objects or dictionaries by proximity to origin coordinate.
    Returns list of tuples (item, distance_km).
    """
    results = []
    for item in items:
        if isinstance(item, dict):
            item_lat = item.get(lat_attr)
            item_lon = item.get(lon_attr)
        else:
            item_lat = getattr(item, lat_attr, None)
            item_lon = getattr(item, lon_attr, None)
        
        if item_lat is not None and item_lon is not None:
            dist = haversine_distance(origin_lat, origin_lon, float(item_lat), float(item_lon))
            results.append((item, dist))
            
    results.sort(key=lambda x: x[1])
    return results
