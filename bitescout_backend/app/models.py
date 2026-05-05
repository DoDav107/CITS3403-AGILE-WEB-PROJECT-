from datetime import datetime
from . import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    preferred_cuisine = db.Column(db.String(80), default="")
    bio = db.Column(db.Text, default="")
    avatar = db.Column(db.String(20), default="🍽️")
    avatar_image = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    reviews = db.relationship('Review', backref='user', cascade='all, delete-orphan', lazy=True)
    favourite_restaurants = db.relationship('FavouriteRestaurant', backref='user', cascade='all, delete-orphan', lazy=True)
    favourite_dishes = db.relationship('FavouriteDish', backref='user', cascade='all, delete-orphan', lazy=True)


class Restaurant(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    suburb = db.Column(db.String(80), nullable=False)
    cuisine = db.Column(db.String(80), nullable=False)
    price = db.Column(db.String(10), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    blurb = db.Column(db.Text, nullable=False)
    address = db.Column(db.String(255), nullable=False)
    tags = db.Column(db.Text, default="")

    dishes = db.relationship('Dish', backref='restaurant', cascade='all, delete-orphan', lazy=True)
    reviews = db.relationship('Review', backref='restaurant', cascade='all, delete-orphan', lazy=True)


class Dish(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    restaurant_id = db.Column(db.String(20), db.ForeignKey('restaurant.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    rating = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)

    reviews = db.relationship('Review', backref='dish', cascade='all, delete-orphan', lazy=True)


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.String(20), db.ForeignKey('restaurant.id'), nullable=False)
    dish_id = db.Column(db.String(20), db.ForeignKey('dish.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class FavouriteRestaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.String(20), db.ForeignKey('restaurant.id'), nullable=False)

    restaurant = db.relationship('Restaurant')


class FavouriteDish(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dish_id = db.Column(db.String(20), db.ForeignKey('dish.id'), nullable=False)

    dish = db.relationship('Dish')
