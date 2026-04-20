from werkzeug.security import generate_password_hash
from . import db
from .models import User, Restaurant, Dish, Review

RESTAURANTS = [
    {
      'id': 'r1', 'name': 'Saigon Alley', 'suburb': 'Northbridge', 'cuisine': 'Vietnamese', 'price': '$$', 'rating': 4.7,
      'lat': -31.9467, 'lng': 115.8587,
      'blurb': 'Modern Vietnamese street food with pho, rice bowls, and fresh iced drinks.',
      'address': '12 James St, Northbridge WA', 'tags': 'noodles,banh mi,iced coffee',
      'dishes': [
        { 'id': 'd1', 'name': 'Special Beef Pho', 'price': 22, 'rating': 4.8, 'description': 'Rich broth, tender beef, herbs, and fresh noodles.' },
        { 'id': 'd2', 'name': 'Crispy Pork Banh Mi', 'price': 14, 'rating': 4.6, 'description': 'Crunchy pork belly with pickled vegetables and pâté.' }
      ]
    },
    {
      'id': 'r2', 'name': 'Harbour Roast', 'suburb': 'Fremantle', 'cuisine': 'Cafe', 'price': '$$', 'rating': 4.5,
      'lat': -32.0569, 'lng': 115.7439,
      'blurb': 'Brunch and specialty coffee spot near the port.',
      'address': '34 Market St, Fremantle WA', 'tags': 'brunch,coffee,pastries',
      'dishes': [
        { 'id': 'd3', 'name': 'Chilli Scramble', 'price': 23, 'rating': 4.5, 'description': 'Soft eggs, sourdough, chilli oil, feta, and herbs.' },
        { 'id': 'd4', 'name': 'Cold Brew Float', 'price': 9, 'rating': 4.4, 'description': 'Smooth cold brew with vanilla ice cream.' }
      ]
    },
    {
      'id': 'r3', 'name': 'Sora Sushi Bar', 'suburb': 'Victoria Park', 'cuisine': 'Japanese', 'price': '$$$', 'rating': 4.8,
      'lat': -31.9737, 'lng': 115.9015,
      'blurb': 'Fresh sushi, sashimi, and omakase-inspired plates.',
      'address': '198 Albany Hwy, Victoria Park WA', 'tags': 'sushi,sashimi,matcha',
      'dishes': [
        { 'id': 'd5', 'name': 'Aburi Salmon Roll', 'price': 24, 'rating': 4.9, 'description': 'Torched salmon roll with mayo, citrus, and tobiko.' },
        { 'id': 'd6', 'name': 'Matcha Cheesecake', 'price': 12, 'rating': 4.7, 'description': 'Creamy matcha cheesecake with sesame crumble.' }
      ]
    }
]


def seed_if_empty():
    if Restaurant.query.first():
        return

    demo = User(
        name='Demo User',
        username='demouser',
        email='demo@bitescout.app',
        password_hash=generate_password_hash('password123'),
        preferred_cuisine='Japanese',
        bio='I love finding hidden gems around Perth.'
    )
    ava = User(
        name='Ava Tran',
        username='avatran',
        email='ava@example.com',
        password_hash=generate_password_hash('password123'),
        preferred_cuisine='Vietnamese',
        bio='Always hunting for comfort food and good coffee.'
    )
    db.session.add_all([demo, ava])

    for r in RESTAURANTS:
        restaurant = Restaurant(
            id=r['id'], name=r['name'], suburb=r['suburb'], cuisine=r['cuisine'], price=r['price'],
            rating=r['rating'], lat=r['lat'], lng=r['lng'], blurb=r['blurb'], address=r['address'], tags=r['tags']
        )
        db.session.add(restaurant)
        for d in r['dishes']:
            db.session.add(Dish(restaurant_id=r['id'], **d))

    db.session.flush()
    db.session.add(Review(user_id=2, restaurant_id='r1', dish_id='d1', rating=5, title='Best broth I have had lately', content='Deep flavour, fresh herbs, and really good portion size.'))
    db.session.add(Review(user_id=1, restaurant_id='r3', dish_id='d5', rating=4, title='Fresh sushi', content='A bit pricey, but the fish quality is worth it.'))
    db.session.commit()
