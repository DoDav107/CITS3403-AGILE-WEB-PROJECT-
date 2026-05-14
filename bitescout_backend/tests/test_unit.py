"""Fast unit tests for pure helpers (no database or HTTP)."""

import os
import unittest
from unittest.mock import patch

from app.google_places import (
    GooglePlacesError,
    dedupe_places,
    get_api_key,
    nearby_payload,
    place_to_result,
)


class GooglePlacesUnitTests(unittest.TestCase):
    def test_place_to_result_maps_display_name_and_location(self):
        place = {
            "id": "places/x",
            "displayName": {"text": "Test Cafe"},
            "formattedAddress": "1 Main St",
            "location": {"latitude": -31.95, "longitude": 115.86},
            "rating": 4.2,
            "primaryType": "cafe",
            "types": ["cafe", "food"],
            "photos": [{"name": "places/x/photos/p1", "authorAttributions": []}],
            "websiteUri": "https://example.com",
            "googleMapsUri": "https://maps.example.com",
        }
        result = place_to_result(place)
        self.assertIsNotNone(result)
        self.assertEqual(result["name"], "Test Cafe")
        self.assertEqual(result["lat"], -31.95)
        self.assertEqual(result["lng"], 115.86)
        self.assertEqual(result["photoName"], "places/x/photos/p1")
        self.assertEqual(result["source"], "google_places")

    def test_place_to_result_returns_none_for_blocked_primary_type(self):
        place = {
            "id": "places/gas",
            "displayName": {"text": "Gas Stop"},
            "primaryType": "gas_station",
            "location": {"latitude": 0, "longitude": 0},
        }
        self.assertIsNone(place_to_result(place))

    def test_dedupe_places_removes_duplicates_and_respects_limit(self):
        places = [
            {"id": "a", "name": "One"},
            {"id": "a", "name": "Dup"},
            {"id": "b", "name": "Two"},
            {"id": "c", "name": "Three"},
        ]
        out = dedupe_places(places, 2)
        self.assertEqual([p["id"] for p in out], ["a", "b"])

    def test_dedupe_places_skips_entries_without_id(self):
        places = [{}, {"id": "", "name": "Empty"}, {"id": "z", "name": "Ok"}]
        out = dedupe_places(places, 10)
        self.assertEqual([p["id"] for p in out], ["z"])

    def test_nearby_payload_includes_circle_and_optional_types(self):
        payload = nearby_payload(-31.0, 116.0, 5000, ["cafe", "restaurant"], 12)
        self.assertEqual(payload["maxResultCount"], 12)
        self.assertEqual(payload["includedTypes"], ["cafe", "restaurant"])
        center = payload["locationRestriction"]["circle"]["center"]
        self.assertEqual(center["latitude"], -31.0)
        self.assertEqual(center["longitude"], 116.0)
        self.assertEqual(payload["locationRestriction"]["circle"]["radius"], 5000.0)

    def test_nearby_payload_omits_included_types_when_empty(self):
        payload = nearby_payload(0, 0, 1000, [], 5)
        self.assertNotIn("includedTypes", payload)

    def test_get_api_key_accepts_explicit_value(self):
        self.assertEqual(get_api_key("my-key"), "my-key")

    def test_get_api_key_raises_when_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(GooglePlacesError) as ctx:
                get_api_key(None)
        self.assertIn("GOOGLE_MAPS_API_KEY", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
