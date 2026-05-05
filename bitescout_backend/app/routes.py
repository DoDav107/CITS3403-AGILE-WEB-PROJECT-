from datetime import datetime
from functools import wraps
from pathlib import Path
import hashlib
import json
from flask import Blueprint, current_app, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from . import google_places
from .models import User, Restaurant, Dish, Review, FavouriteRestaurant, FavouriteDish


bp = Blueprint('main', __name__)


def current_user():
    user_id = session.get('user_id')
    return db.session.get(User, user_id) if user_id else None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return fn(*args, **kwargs)
    return wrapper


def user_to_dict(user):
    return {
        'id': user.id,
        'name': user.name,
        'username': user.username,
        'email': user.email,
        'preferredCuisine': user.preferred_cuisine,
        'bio': user.bio or '',
        'avatar': getattr(user, 'avatar', None) or '🍽️',
        'avatarImage': getattr(user, 'avatar_image', None) or '',
        'createdAt': user.created_at.isoformat(),
    }


def dish_to_dict(dish):
    return {
        'id': dish.id,
        'restaurantId': dish.restaurant_id,
        'name': dish.name,
        'price': dish.price,
        'rating': dish.rating,
        'description': dish.description,
    }


def restaurant_to_dict(restaurant, include_dishes=False):
    data = {
        'id': restaurant.id,
        'name': restaurant.name,
        'suburb': restaurant.suburb,
        'cuisine': restaurant.cuisine,
        'price': restaurant.price,
        'rating': restaurant.rating,
        'lat': restaurant.lat,
        'lng': restaurant.lng,
        'blurb': restaurant.blurb,
        'address': restaurant.address,
        'tags': [tag.strip() for tag in restaurant.tags.split(',') if tag.strip()],
    }
    if include_dishes:
        data['dishes'] = [dish_to_dict(d) for d in restaurant.dishes]
    return data


def review_to_dict(review):
    return {
        'id': review.id,
        'userId': review.user_id,
        'restaurantId': review.restaurant_id,
        'dishId': review.dish_id or '',
        'rating': review.rating,
        'title': review.title,
        'content': review.content,
        'createdAt': review.created_at.isoformat(),
        'updatedAt': review.updated_at.isoformat(),
        'user': {'id': review.user.id, 'name': review.user.name, 'username': review.user.username},
    }


def google_maps_api_key():
    return (current_app.config.get("GOOGLE_MAPS_API_KEY") or "").strip()


def format_place_type(value):
    words = str(value or '').replace('_', ' ').split()
    if not words:
        return 'Restaurant'
    return ' '.join(word.capitalize() for word in words)


def google_restaurant_id(place_id):
    digest = hashlib.sha1(str(place_id).encode('utf-8')).hexdigest()[:16]
    return f"g_{digest}"


def google_place_tags(types, primary_type=''):
    ignored = {'point_of_interest', 'establishment', 'food', 'store'}
    primary = str(primary_type or '').strip()
    tags = []
    for place_type in types or []:
        normalized = str(place_type or '').strip()
        if not normalized or normalized in ignored or normalized == primary:
            continue
        if normalized not in tags:
            tags.append(normalized)
    return tags


def suburb_from_address(address):
    parts = [part.strip() for part in str(address or '').split(',') if part.strip()]
    if len(parts) >= 2:
        return parts[1]
    return parts[0] if parts else 'Nearby'


def parse_review_rating(raw_value):
    try:
        rating = int(raw_value)
    except (TypeError, ValueError):
        return None
    return rating if 1 <= rating <= 5 else None


def sync_restaurant_rating(restaurant_id):
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return

    reviews = Review.query.filter_by(restaurant_id=restaurant_id).all()
    if not reviews:
        restaurant.rating = 0.0
        return

    restaurant.rating = round(sum(review.rating for review in reviews) / len(reviews), 1)


@bp.get('/')
def index():
    return current_app.send_static_file('index.html')


@bp.get('/health')
def health():
    return jsonify({'status': 'ok'})


@bp.get('/api/restaurants')
def restaurants():
    search = (request.args.get('search') or '').strip().lower()
    cuisine = request.args.get('cuisine') or ''
    price = request.args.get('price') or ''
    tag = (request.args.get('tag') or '').strip().lower()
    min_rating = float(request.args.get('min_rating') or 0)

    items = Restaurant.query.all()
    results = []
    for r in items:
        haystack = f"{r.name} {r.suburb} {r.cuisine} {r.tags}".lower()
        tags = [item.strip().lower() for item in r.tags.split(',') if item.strip()]
        if search and search not in haystack:
            continue
        if cuisine and r.cuisine != cuisine:
            continue
        if price and r.price != price:
            continue
        if tag and tag not in tags:
            continue
        if r.rating < min_rating:
            continue
        results.append(restaurant_to_dict(r))
    return jsonify(results)


@bp.get('/api/restaurants/<restaurant_id>')
def restaurant_detail(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return jsonify(restaurant_to_dict(restaurant, include_dishes=True))


@bp.post('/api/restaurants/from-google')
def restaurant_from_google():
    payload = request.get_json(silent=True) or {}
    place_id = payload.get('placeId') or payload.get('id')
    name = (payload.get('name') or '').strip()
    address = (payload.get('address') or '').strip()

    if not place_id or not name:
        return jsonify({'error': 'Google place id and name are required.'}), 400

    try:
        lat = float(payload.get('lat'))
        lng = float(payload.get('lng'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Latitude and longitude are required.'}), 400

    try:
        rating = float(payload.get('rating') or 0)
    except (TypeError, ValueError):
        rating = 0.0

    primary_type = payload.get('primaryType') or 'restaurant'
    tags = google_place_tags(payload.get('types') or [], primary_type)
    restaurant_id = google_restaurant_id(place_id)
    restaurant = db.session.get(Restaurant, restaurant_id)
    status_code = 200 if restaurant else 201

    if not restaurant:
        restaurant = Restaurant(id=restaurant_id)
        db.session.add(restaurant)

    restaurant.name = name
    restaurant.suburb = suburb_from_address(address)
    restaurant.cuisine = format_place_type(primary_type)
    restaurant.price = payload.get('price') or '$$'
    restaurant.rating = max(0.0, min(5.0, rating))
    restaurant.lat = lat
    restaurant.lng = lng
    restaurant.blurb = payload.get('blurb') or f"Live Google Places listing for {name}."
    restaurant.address = address or 'Address unavailable'
    restaurant.tags = ','.join(tags)

    db.session.commit()
    return jsonify({'message': 'Restaurant synced', 'restaurant': restaurant_to_dict(restaurant, include_dishes=True)}), status_code


@bp.get('/api/restaurants/<restaurant_id>/reviews')
def restaurant_reviews(restaurant_id):
    reviews = Review.query.filter_by(restaurant_id=restaurant_id).order_by(Review.created_at.desc()).all()
    return jsonify([review_to_dict(r) for r in reviews])


@bp.get('/api/dishes/<restaurant_id>/<dish_id>')
def dish_detail(restaurant_id, dish_id):
    dish = Dish.query.filter_by(id=dish_id, restaurant_id=restaurant_id).first_or_404()
    return jsonify(dish_to_dict(dish))


@bp.get('/api/users/<int:user_id>')
def user_profile(user_id):
    user = User.query.get_or_404(user_id)
    data = user_to_dict(user)
    data['reviews'] = [review_to_dict(r) for r in sorted(user.reviews, key=lambda x: x.created_at, reverse=True)]
    return jsonify(data)


@bp.post('/api/auth/signup')
def signup():
    payload = request.get_json(silent=True) or request.form.to_dict()
    required = ['name', 'username', 'email', 'password']
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400
    if User.query.filter((User.email == payload['email']) | (User.username == payload['username'])).first():
        return jsonify({'error': 'Email or username already exists'}), 409

    user = User(
        name=payload['name'],
        username=payload['username'],
        email=payload['email'],
        password_hash=generate_password_hash(payload['password']),
        preferred_cuisine=payload.get('preferredCuisine', ''),
        bio=payload.get('bio', ''),
        avatar=(payload.get('avatar') or '🍽️')[:20],
        avatar_image=payload.get('avatarImage') or '',
    )
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    return jsonify({'message': 'Account created', 'user': user_to_dict(user)}), 201


@bp.post('/api/auth/login')
def login():
    payload = request.get_json(silent=True) or request.form.to_dict()
    email = payload.get('email', '')
    password = payload.get('password', '')
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Incorrect email or password'}), 401
    session['user_id'] = user.id
    return jsonify({'message': 'Logged in', 'user': user_to_dict(user)})


@bp.post('/api/auth/logout')
@login_required
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@bp.get('/api/auth/me')
def me():
    user = current_user()
    if not user:
        return jsonify({'user': None})
    return jsonify({'user': user_to_dict(user)})


@bp.put('/api/auth/me')
@login_required
def update_me():
    payload = request.get_json(silent=True) or request.form.to_dict()
    user = current_user()

    name = (payload.get('name') or '').strip()
    preferred_cuisine = (payload.get('preferredCuisine') or '').strip()
    bio = (payload.get('bio') or '').strip()
    avatar = (payload.get('avatar') or '').strip()
    avatar_image = (payload.get('avatarImage') or '').strip()

    if not name:
        return jsonify({'error': 'Display name is required.'}), 400
    if len(name) > 120:
        return jsonify({'error': 'Display name must be 120 characters or fewer.'}), 400
    if len(preferred_cuisine) > 80:
        return jsonify({'error': 'Preferred cuisine must be 80 characters or fewer.'}), 400
    if len(bio) > 300:
        return jsonify({'error': 'Bio must be 300 characters or fewer.'}), 400
    if len(avatar) > 20:
        return jsonify({'error': 'Avatar value is too long.'}), 400
    if len(avatar_image) > 3_000_000:
        return jsonify({'error': 'Avatar image is too large.'}), 400

    user.name = name
    user.preferred_cuisine = preferred_cuisine
    user.bio = bio
    user.avatar = avatar or '🍽️'
    user.avatar_image = avatar_image
    db.session.commit()

    return jsonify({'message': 'Profile updated', 'user': user_to_dict(user)})


@bp.post('/api/place-requests')
def create_place_request():
    payload = request.get_json(silent=True) or request.form.to_dict()
    place_name = (payload.get('placeName') or '').strip()
    suburb = (payload.get('suburb') or '').strip()
    category = (payload.get('category') or '').strip()
    notes = (payload.get('notes') or '').strip()
    contact = (payload.get('contact') or '').strip()

    if not place_name:
        return jsonify({'error': 'Place name is required.'}), 400

    request_record = {
        'placeName': place_name,
        'suburb': suburb,
        'category': category,
        'notes': notes,
        'contact': contact,
        'createdAt': datetime.utcnow().isoformat(),
    }

    instance_dir = Path(current_app.instance_path)
    instance_dir.mkdir(parents=True, exist_ok=True)
    request_file = instance_dir / 'place_requests.json'

    if request_file.exists():
        try:
            existing_requests = json.loads(request_file.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            existing_requests = []
    else:
        existing_requests = []

    existing_requests.append(request_record)
    request_file.write_text(json.dumps(existing_requests, indent=2), encoding='utf-8')

    return jsonify({'message': 'Place request submitted', 'request': request_record}), 201


@bp.get('/api/reviews')
def list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([review_to_dict(r) for r in reviews])


@bp.post('/api/google/nearby')
def google_nearby():
    payload = request.get_json(silent=True) or {}
    api_key = google_maps_api_key()
    if not api_key:
        return jsonify({'error': 'Google Maps API key is not configured on the server.'}), 500

    try:
        lat = float(payload.get('lat'))
        lng = float(payload.get('lng'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Latitude and longitude are required.'}), 400

    radius = payload.get('radius', 8000)
    included_types = payload.get('includedTypes') or ['restaurant', 'cafe']
    max_result_count = payload.get('maxResultCount', 12)

    try:
        results = google_places.search_nearby_places(
            api_key, lat, lng, radius, included_types, max_result_count
        )
    except google_places.GooglePlacesError as error:
        return jsonify({'error': str(error)}), error.status_code

    return jsonify({'results': results})


@bp.post('/api/google/search-location')
def google_search_location():
    payload = request.get_json(silent=True) or {}
    api_key = google_maps_api_key()
    if not api_key:
        return jsonify({'error': 'Google Maps API key is not configured on the server.'}), 500

    address = (payload.get('address') or '').strip()
    if not address:
        return jsonify({'error': 'Please enter a suburb, postcode, or address.'}), 400

    radius = payload.get('radius', 8000)
    included_types = payload.get('includedTypes') or ['restaurant', 'cafe']
    max_result_count = payload.get('maxResultCount', 12)

    try:
        search_location = google_places.geocode_address(api_key, address)
        results = google_places.search_nearby_places(
            api_key,
            search_location['lat'],
            search_location['lng'],
            radius,
            included_types,
            max_result_count,
        )
    except google_places.GooglePlacesError as error:
        return jsonify({'error': str(error)}), error.status_code

    return jsonify({'searchLocation': search_location, 'results': results})


@bp.post('/api/reviews')
@login_required
def create_review():
    payload = request.get_json(silent=True) or request.form.to_dict()
    required = ['restaurantId', 'rating', 'title', 'content']
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    restaurant = db.session.get(Restaurant, payload['restaurantId'])
    if not restaurant:
        return jsonify({'error': 'Restaurant not found'}), 404
    dish_id = payload.get('dishId') or None
    if dish_id and not Dish.query.filter_by(id=dish_id, restaurant_id=payload['restaurantId']).first():
        return jsonify({'error': 'Dish not found for restaurant'}), 404
    rating = parse_review_rating(payload.get('rating'))
    if rating is None:
        return jsonify({'error': 'Rating must be an integer between 1 and 5.'}), 400

    review = Review(
        user_id=current_user().id,
        restaurant_id=payload['restaurantId'],
        dish_id=dish_id,
        rating=rating,
        title=payload['title'],
        content=payload['content'],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(review)
    db.session.flush()
    sync_restaurant_rating(review.restaurant_id)
    db.session.commit()
    return jsonify({'message': 'Review created', 'review': review_to_dict(review)}), 201


@bp.put('/api/reviews/<int:review_id>')
@login_required
def update_review(review_id):
    review = Review.query.get_or_404(review_id)
    if review.user_id != current_user().id:
        return jsonify({'error': 'Forbidden'}), 403
    payload = request.get_json(silent=True) or request.form.to_dict()
    if 'rating' in payload:
        rating = parse_review_rating(payload.get('rating'))
        if rating is None:
            return jsonify({'error': 'Rating must be an integer between 1 and 5.'}), 400
        review.rating = rating
    review.title = payload.get('title', review.title)
    review.content = payload.get('content', review.content)
    review.updated_at = datetime.utcnow()
    db.session.flush()
    sync_restaurant_rating(review.restaurant_id)
    db.session.commit()
    return jsonify({'message': 'Review updated', 'review': review_to_dict(review)})


@bp.delete('/api/reviews/<int:review_id>')
@login_required
def delete_review(review_id):
    review = Review.query.get_or_404(review_id)
    if review.user_id != current_user().id:
        return jsonify({'error': 'Forbidden'}), 403
    restaurant_id = review.restaurant_id
    db.session.delete(review)
    db.session.flush()
    sync_restaurant_rating(restaurant_id)
    db.session.commit()
    return jsonify({'message': 'Review deleted'})


@bp.get('/api/favourites')
@login_required
def favourites():
    user = current_user()
    restaurants = [restaurant_to_dict(f.restaurant) for f in user.favourite_restaurants if getattr(f, 'restaurant', None)]
    dishes = [
        {
            'dish': dish_to_dict(f.dish),
            'restaurant': restaurant_to_dict(f.dish.restaurant)
        }
        for f in user.favourite_dishes if getattr(f, 'dish', None)
    ]
    return jsonify({'restaurants': restaurants, 'dishes': dishes})


@bp.post('/api/favourites/restaurants/<restaurant_id>')
@login_required
def save_favourite_restaurant(restaurant_id):
    if not db.session.get(Restaurant, restaurant_id):
        return jsonify({'error': 'Restaurant not found'}), 404
    user = current_user()
    existing = FavouriteRestaurant.query.filter_by(user_id=user.id, restaurant_id=restaurant_id).first()
    if not existing:
        db.session.add(FavouriteRestaurant(user_id=user.id, restaurant_id=restaurant_id))
        db.session.commit()
    return jsonify({'message': 'Restaurant saved'})


@bp.delete('/api/favourites/restaurants/<restaurant_id>')
@login_required
def remove_favourite_restaurant(restaurant_id):
    user = current_user()
    item = FavouriteRestaurant.query.filter_by(user_id=user.id, restaurant_id=restaurant_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Restaurant removed'})


@bp.post('/api/favourites/dishes')
@login_required
def save_favourite_dish():
    payload = request.get_json(silent=True) or request.form.to_dict()
    dish_id = payload.get('dishId')
    dish = db.session.get(Dish, dish_id)
    if not dish:
        return jsonify({'error': 'Dish not found'}), 404
    user = current_user()
    existing = FavouriteDish.query.filter_by(user_id=user.id, dish_id=dish_id).first()
    if not existing:
        db.session.add(FavouriteDish(user_id=user.id, dish_id=dish_id))
        db.session.commit()
    return jsonify({'message': 'Dish saved'})


@bp.delete('/api/favourites/dishes/<dish_id>')
@login_required
def remove_favourite_dish(dish_id):
    user = current_user()
    item = FavouriteDish.query.filter_by(user_id=user.id, dish_id=dish_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Dish removed'})
