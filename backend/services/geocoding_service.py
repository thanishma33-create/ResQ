import urllib.request
import urllib.parse
import json
import logging
from typing import Optional, Dict, Tuple

logger = logging.getLogger("resq.geocoding")

# In-memory LRU-like cache for reverse geocoding to prevent excessive network calls
_GEOCODE_CACHE: Dict[Tuple[float, float], Optional[str]] = {}
_MAX_CACHE_SIZE = 500

def reverse_geocode(latitude: float, longitude: float, timeout_sec: float = 3.0) -> Optional[str]:
    """
    Dynamically resolves human-readable location name for geographic coordinates.
    Uses OpenStreetMap Nominatim with safe timeouts and in-memory caching.
    Returns None if offline, timeout, or reverse geocoding is unavailable.
    Never returns a hardcoded city fallback.
    """
    if latitude is None or longitude is None:
        return None

    # Round to 3 decimal places (~110 meters) for caching efficiency
    cache_key = (round(float(latitude), 3), round(float(longitude), 3))
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse?"
            f"format=json&lat={latitude}&lon={longitude}&zoom=14&addressdetails=1"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ResQ-Disaster-Relief-Backend/1.0 (Emergency Response Platform)",
                "Accept-Language": "en"
            }
        )

        with urllib.request.urlopen(req, timeout=timeout_sec) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                address = data.get("address", {})

                locality = (
                    address.get("suburb")
                    or address.get("neighbourhood")
                    or address.get("city_district")
                    or address.get("village")
                    or address.get("town")
                    or address.get("city")
                    or address.get("county")
                    or ""
                )
                state = address.get("state_district") or address.get("state") or address.get("country") or ""

                if locality and state:
                    resolved_name = f"{locality}, {state}"
                elif locality or state:
                    resolved_name = locality or state
                else:
                    resolved_name = data.get("display_name", "").split(",")[0].strip() or None

                if len(_GEOCODE_CACHE) > _MAX_CACHE_SIZE:
                    _GEOCODE_CACHE.clear()

                _GEOCODE_CACHE[cache_key] = resolved_name
                return resolved_name
    except Exception as e:
        logger.debug(f"Reverse geocoding network query skipped/failed for ({latitude}, {longitude}): {e}")

    # Graceful fallback to None (Frontend can safely display 'Current GPS Location')
    return None
