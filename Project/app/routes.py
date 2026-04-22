from flask import Blueprint, jsonify

from .models import Restaurant


bp = Blueprint("main", __name__)


@bp.get("/")
def index():
    return jsonify({"message": "Fork & Frame backend is running"})


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/api/restaurants")
def list_restaurants():
    restaurants = Restaurant.query.order_by(Restaurant.name.asc()).all()
    payload = [
        {
            "id": restaurant.id,
            "name": restaurant.name,
            "cuisine_type": restaurant.cuisine_type,
            "suburb": restaurant.suburb,
            "description": restaurant.description,
        }
        for restaurant in restaurants
    ]
    return jsonify(payload)
