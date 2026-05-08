import os
from pathlib import Path
from urllib.parse import quote_plus
import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"
PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACE_PHOTO_MEDIA_URL = "https://places.googleapis.com/v1/{photo_name}/media"
TEXT_SEARCH_PAGE_SIZE = 20
PLACES_FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.location,"
    "places.rating,"
    "places.primaryType,"
    "places.types,"
    "places.photos,"
    "places.websiteUri,"
    "places.googleMapsUri"
)

BLOCKED_PRIMARY_TYPES = {
    "gas_station",
    "indoor_playground",
    "playground",
    "amusement_center",
}


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


def place_to_result(place):
    primary_type = place.get("primaryType", "")
    if primary_type in BLOCKED_PRIMARY_TYPES:
        return None

    return {
        "id": place.get("id"),
        "name": place.get("displayName", {}).get("text", ""),
        "address": place.get("formattedAddress", ""),
        "lat": place.get("location", {}).get("latitude"),
        "lng": place.get("location", {}).get("longitude"),
        "rating": place.get("rating", 0),
        "primaryType": primary_type,
        "types": place.get("types", []),
        "photoName": ((place.get("photos") or [{}])[0].get("name") or ""),
        "photoAttributions": ((place.get("photos") or [{}])[0].get("authorAttributions") or []),
        "websiteUri": place.get("websiteUri", ""),
        "googleMapsUri": place.get("googleMapsUri", ""),
        "source": "google_places",
    }


def dedupe_places(places, limit):
    deduped = []
    seen = set()
    for place in places:
        if not place or not place.get("id") or place["id"] in seen:
            continue
        seen.add(place["id"])
        deduped.append(place)
        if len(deduped) >= limit:
            break
    return deduped


def request_places(url, api_key, payload):
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=15)

    if not response.ok:
        raise GooglePlacesError(f"Google Places error {response.status_code}: {response.text}", response.status_code)

    return [result for result in (place_to_result(place) for place in response.json().get("places", [])) if result]


def request_text_places_page(api_key, payload):
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": f"{PLACES_FIELD_MASK},nextPageToken",
    }

    response = requests.post(PLACES_TEXT_SEARCH_URL, json=payload, headers=headers, timeout=15)

    if not response.ok:
        raise GooglePlacesError(f"Google Places error {response.status_code}: {response.text}", response.status_code)

    data = response.json()
    return {
        "places": [result for result in (place_to_result(place) for place in data.get("places", [])) if result],
        "nextPageToken": data.get("nextPageToken", ""),
    }


def nearby_payload(lat, lng, radius, included_types, max_result_count):
    payload = {
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
    if included_types:
        payload["includedTypes"] = included_types
    return payload


def search_nearby_places(api_key, lat, lng, radius=8000, included_types=None, max_result_count=12):
    api_key = get_api_key(api_key)

    if included_types is None or len(included_types) == 0:
        included_types = ["restaurant", "cafe"]
    included_types = list(dict.fromkeys(str(place_type) for place_type in included_types if place_type))

    requested_total = max(1, min(int(max_result_count), 80))
    per_request = min(20, requested_total)
    results = request_places(
        PLACES_NEARBY_URL,
        api_key,
        nearby_payload(lat, lng, radius, included_types, per_request),
    )

    if requested_total > 20 or len(included_types) > 2:
        for place_type in included_types[:10]:
            if len(dedupe_places(results, requested_total)) >= requested_total:
                break
            results.extend(request_places(
                PLACES_NEARBY_URL,
                api_key,
                nearby_payload(lat, lng, radius, [place_type], per_request),
            ))

    return dedupe_places(results, requested_total)


def search_text_places(api_key, query, lat=None, lng=None, radius=10000, max_result_count=20):
    api_key = get_api_key(api_key)
    text_query = str(query or "").strip()
    if not text_query:
        return []

    requested_total = max(1, min(int(max_result_count), 60))
    payload = {
        "textQuery": text_query,
        "pageSize": min(TEXT_SEARCH_PAGE_SIZE, requested_total),
    }
    if lat is not None and lng is not None:
        payload["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": float(lat),
                    "longitude": float(lng),
                },
                "radius": float(radius),
            }
        }

    results = []
    page_payload = dict(payload)
    while len(dedupe_places(results, requested_total)) < requested_total:
        page = request_text_places_page(api_key, page_payload)
        results.extend(page["places"])
        next_page_token = page.get("nextPageToken")
        if not next_page_token:
            break
        page_payload = dict(payload)
        page_payload["pageToken"] = next_page_token

    return dedupe_places(results, requested_total)


def get_photo_media_uri(api_key, photo_name, max_width=900, max_height=650):
    api_key = get_api_key(api_key)
    safe_photo_name = str(photo_name or "").strip().strip("/")

    if not safe_photo_name.startswith("places/") or "/photos/" not in safe_photo_name:
        raise GooglePlacesError("Invalid Google place photo name", 400)

    response = requests.get(
        PLACE_PHOTO_MEDIA_URL.format(photo_name=safe_photo_name),
        params={
            "maxWidthPx": int(max_width),
            "maxHeightPx": int(max_height),
            "skipHttpRedirect": "true",
            "key": api_key,
        },
        timeout=15,
    )

    if not response.ok:
        raise GooglePlacesError(f"Google Place Photo error {response.status_code}: {response.text}", response.status_code)

    payload = response.json()
    photo_uri = payload.get("photoUri")
    if not photo_uri:
        raise GooglePlacesError("Google Place Photo did not return an image URI", 502)

    return photo_uri
