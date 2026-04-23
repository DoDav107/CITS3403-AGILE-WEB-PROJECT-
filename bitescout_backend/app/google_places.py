import os
from pathlib import Path
from urllib.parse import quote_plus
import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class GooglePlacesError(Exception):
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code


def get_api_key(explicit_api_key=None):
    api_key = explicit_api_key or os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise GooglePlacesError("GOOGLE_MAPS_API_KEY is not set in your environment or .env file", 500)
    return str(api_key).strip()


def geocode_address(api_key, address):
    api_key = get_api_key(api_key)

    if not address or not str(address).strip():
        raise GooglePlacesError("Address is required", 400)

    url = f"{GEOCODE_URL}?address={quote_plus(address.strip())}&key={api_key}"
    response = requests.get(url, timeout=15)

    if not response.ok:
        raise GooglePlacesError(f"Google Geocoding error {response.status_code}: {response.text}", response.status_code)

    data = response.json()

    if data.get("status") != "OK" or not data.get("results"):
        raise GooglePlacesError(f"Unable to geocode address: {data.get('status', 'UNKNOWN_ERROR')}", 400)

    first = data["results"][0]
    location = first["geometry"]["location"]

    return {
        "lat": location["lat"],
        "lng": location["lng"],
        "formattedAddress": first.get("formatted_address", address),
    }


def search_nearby_places(api_key, lat, lng, radius=8000, included_types=None, max_result_count=12):
    api_key = get_api_key(api_key)

    if included_types is None or len(included_types) == 0:
        included_types = ["restaurant", "cafe"]

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.rating,"
            "places.primaryType,"
            "places.types"
        ),
    }

    payload = {
        "includedTypes": included_types,
        "maxResultCount": int(max_result_count),
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": float(lat),
                    "longitude": float(lng),
                },
                "radius": float(radius),
            }
        },
    }

    response = requests.post(
        PLACES_NEARBY_URL,
        json=payload,
        headers=headers,
        timeout=15,
    )

    if not response.ok:
        raise GooglePlacesError(f"Google Places error {response.status_code}: {response.text}", response.status_code)

    data = response.json()
    places = data.get("places", [])

    results = []
    blocked_primary_types = {
        "gas_station",
        "indoor_playground",
        "playground",
        "amusement_center",
    }

    for place in places:
        primary_type = place.get("primaryType", "")
        rating = place.get("rating", 0)

        if primary_type in blocked_primary_types:
            continue

        results.append({
            "id": place.get("id"),
            "name": place.get("displayName", {}).get("text", ""),
            "address": place.get("formattedAddress", ""),
            "lat": place.get("location", {}).get("latitude"),
            "lng": place.get("location", {}).get("longitude"),
            "rating": rating,
            "primaryType": primary_type,
            "types": place.get("types", []),
            "source": "google_places",
        })

    return results
