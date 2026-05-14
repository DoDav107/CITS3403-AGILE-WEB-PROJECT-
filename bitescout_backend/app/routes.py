from datetime import datetime
from functools import wraps
from hmac import compare_digest
import secrets

from flask import Blueprint, jsonify, request, session
from sqlalchemy import or_

from . import db
from .models import Dish, FavouriteDish, FavouriteRestaurant, Restaurant, Review, User


bp = Blueprint("main", __name__)
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def get_csrf_token():
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token


def require_csrf():
    if request.method not in UNSAFE_METHODS or not request.path.startswith("/api/"):
        return None

    expected = session.get("csrf_token")
    supplied = (
        request.headers.get("X-CSRFToken")
        or request.headers.get("X-CSRF-Token")
        or request.form.get("csrf_token")
    )
    if not expected or not supplied or not compare_digest(expected, supplied):
        return jsonify({"error": "Invalid CSRF token"}), 400

    return None


def current_user():
    user_id = session.get("user_id")
    return db.session.get(User, user_id) if user_id else None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            return jsonify({"error": "Authentication required"}), 401
        return fn(*args, **kwargs)

    return wrapper


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "preferredCuisine": user.preferred_cuisine,
        "bio": user.bio,
        "createdAt": user.created_at.isoformat(),
    }


def dish_to_dict(dish):
    return {
        "id": dish.id,
        "restaurantId": dish.restaurant_id,
        "name": dish.name,
        "price": dish.price,
        "rating": dish.rating,
        "description": dish.description,
    }


def restaurant_to_dict(restaurant, include_dishes=False):
    data = {
        "id": restaurant.id,
        "name": restaurant.name,
        "suburb": restaurant.suburb,
        "cuisine": restaurant.cuisine,
        "price": restaurant.price,
        "rating": restaurant.rating,
        "lat": restaurant.lat,
        "lng": restaurant.lng,
        "blurb": restaurant.blurb,
        "address": restaurant.address,
        "tags": [tag.strip() for tag in restaurant.tags.split(",") if tag.strip()],
    }
    if include_dishes:
        data["dishes"] = [dish_to_dict(dish) for dish in restaurant.dishes]
    return data


def review_to_dict(review):
    return {
        "id": review.id,
        "userId": review.user_id,
        "restaurantId": review.restaurant_id,
        "dishId": review.dish_id or "",
        "rating": review.rating,
        "title": review.title,
        "content": review.content,
        "createdAt": review.created_at.isoformat(),
        "updatedAt": review.updated_at.isoformat(),
        "user": {"id": review.user.id, "name": review.user.name, "username": review.user.username},
    }


def update_restaurant_rating(restaurant_id):
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return

    reviews = Review.query.filter_by(restaurant_id=restaurant_id).all()
    restaurant.rating = round(sum(review.rating for review in reviews) / len(reviews), 1) if reviews else 0
    db.session.commit()


@bp.get("/api/csrf-token")
def csrf_token():
    return jsonify({"csrfToken": get_csrf_token()})


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/api/restaurants")
def restaurants():
    search = (request.args.get("search") or "").strip().lower()
    cuisine = request.args.get("cuisine") or ""
    price = request.args.get("price") or ""
    min_rating = float(request.args.get("min_rating") or 0)

    results = []
    for restaurant in Restaurant.query.all():
        haystack = f"{restaurant.name} {restaurant.suburb} {restaurant.cuisine} {restaurant.tags}".lower()
        if search and search not in haystack:
            continue
        if cuisine and restaurant.cuisine != cuisine:
            continue
        if price and restaurant.price != price:
            continue
        if restaurant.rating < min_rating:
            continue
        results.append(restaurant_to_dict(restaurant))
    return jsonify(results)


@bp.get("/api/restaurants/<restaurant_id>")
def restaurant_detail(restaurant_id):
    restaurant = db.get_or_404(Restaurant, restaurant_id)
    return jsonify(restaurant_to_dict(restaurant, include_dishes=True))


@bp.get("/api/restaurants/<restaurant_id>/reviews")
def restaurant_reviews(restaurant_id):
    reviews = Review.query.filter_by(restaurant_id=restaurant_id).order_by(Review.created_at.desc()).all()
    return jsonify([review_to_dict(review) for review in reviews])


@bp.get("/api/dishes/<restaurant_id>/<dish_id>")
def dish_detail(restaurant_id, dish_id):
    dish = Dish.query.filter_by(id=dish_id, restaurant_id=restaurant_id).first_or_404()
    return jsonify(dish_to_dict(dish))


@bp.get("/api/users/<int:user_id>")
def user_profile(user_id):
    user = db.get_or_404(User, user_id)
    data = user_to_dict(user)
    data["reviews"] = [review_to_dict(r) for r in sorted(user.reviews, key=lambda item: item.created_at, reverse=True)]
    return jsonify(data)


@bp.post("/api/auth/signup")
def signup():
    payload = request.get_json(silent=True) or request.form.to_dict()
    required = ["name", "username", "email", "password"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    email = payload["email"].strip().lower()
    username = payload["username"].strip()
    if User.query.filter(or_(User.email == email, User.username == username)).first():
        return jsonify({"error": "Email or username already exists"}), 409

    user = User(
        name=payload["name"].strip(),
        username=username,
        email=email,
        preferred_cuisine=payload.get("preferredCuisine", ""),
        bio=payload.get("bio", ""),
    )
    user.set_password(payload["password"])
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"message": "Account created", "user": user_to_dict(user)}), 201


@bp.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or request.form.to_dict()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Incorrect email or password"}), 401
    session["user_id"] = user.id
    return jsonify({"message": "Logged in", "user": user_to_dict(user)})


@bp.post("/api/auth/logout")
@login_required
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@bp.get("/api/auth/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"user": None})
    return jsonify({"user": user_to_dict(user)})


@bp.get("/api/reviews")
def list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([review_to_dict(review) for review in reviews])


@bp.post("/api/reviews")
@login_required
def create_review():
    payload = request.get_json(silent=True) or request.form.to_dict()
    required = ["restaurantId", "rating", "title", "content"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    restaurant_id = payload["restaurantId"]
    if not db.session.get(Restaurant, restaurant_id):
        return jsonify({"error": "Restaurant not found"}), 404

    dish_id = payload.get("dishId") or None
    if dish_id and not Dish.query.filter_by(id=dish_id, restaurant_id=restaurant_id).first():
        return jsonify({"error": "Dish not found for restaurant"}), 404

    rating = int(payload["rating"])
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    review = Review(
        user_id=current_user().id,
        restaurant_id=restaurant_id,
        dish_id=dish_id,
        rating=rating,
        title=payload["title"],
        content=payload["content"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(review)
    db.session.commit()
    update_restaurant_rating(review.restaurant_id)
    return jsonify({"message": "Review created", "review": review_to_dict(review)}), 201


@bp.put("/api/reviews/<int:review_id>")
@login_required
def update_review(review_id):
    review = db.get_or_404(Review, review_id)
    if review.user_id != current_user().id:
        return jsonify({"error": "Forbidden"}), 403

    payload = request.get_json(silent=True) or request.form.to_dict()
    new_rating = int(payload.get("rating", review.rating))
    if new_rating < 1 or new_rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    review.rating = new_rating
    review.title = payload.get("title", review.title)
    review.content = payload.get("content", review.content)
    review.updated_at = datetime.utcnow()
    db.session.commit()
    update_restaurant_rating(review.restaurant_id)
    return jsonify({"message": "Review updated", "review": review_to_dict(review)})


@bp.delete("/api/reviews/<int:review_id>")
@login_required
def delete_review(review_id):
    review = db.get_or_404(Review, review_id)
    if review.user_id != current_user().id:
        return jsonify({"error": "Forbidden"}), 403

    restaurant_id = review.restaurant_id
    db.session.delete(review)
    db.session.commit()
    update_restaurant_rating(restaurant_id)
    return jsonify({"message": "Review deleted"})


@bp.get("/api/favourites")
@login_required
def favourites():
    user = current_user()
    restaurants_payload = [restaurant_to_dict(item.restaurant) for item in user.favourite_restaurants if item.restaurant]
    dishes_payload = [
        {"dish": dish_to_dict(item.dish), "restaurant": restaurant_to_dict(item.dish.restaurant)}
        for item in user.favourite_dishes
        if item.dish
    ]
    return jsonify({"restaurants": restaurants_payload, "dishes": dishes_payload})


@bp.post("/api/favourites/restaurants/<restaurant_id>")
@login_required
def save_favourite_restaurant(restaurant_id):
    if not db.session.get(Restaurant, restaurant_id):
        return jsonify({"error": "Restaurant not found"}), 404

    user = current_user()
    existing = FavouriteRestaurant.query.filter_by(user_id=user.id, restaurant_id=restaurant_id).first()
    if not existing:
        db.session.add(FavouriteRestaurant(user_id=user.id, restaurant_id=restaurant_id))
        db.session.commit()
    return jsonify({"message": "Restaurant saved"})


@bp.delete("/api/favourites/restaurants/<restaurant_id>")
@login_required
def remove_favourite_restaurant(restaurant_id):
    user = current_user()
    item = FavouriteRestaurant.query.filter_by(user_id=user.id, restaurant_id=restaurant_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Restaurant removed"})


@bp.post("/api/favourites/dishes")
@login_required
def save_favourite_dish():
    payload = request.get_json(silent=True) or request.form.to_dict()
    dish_id = payload.get("dishId")
    dish = db.session.get(Dish, dish_id)
    if not dish:
        return jsonify({"error": "Dish not found"}), 404

    user = current_user()
    existing = FavouriteDish.query.filter_by(user_id=user.id, dish_id=dish_id).first()
    if not existing:
        db.session.add(FavouriteDish(user_id=user.id, dish_id=dish_id))
        db.session.commit()
    return jsonify({"message": "Dish saved"})


@bp.delete("/api/favourites/dishes/<dish_id>")
@login_required
def remove_favourite_dish(dish_id):
    user = current_user()
    item = FavouriteDish.query.filter_by(user_id=user.id, dish_id=dish_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Dish removed"})
