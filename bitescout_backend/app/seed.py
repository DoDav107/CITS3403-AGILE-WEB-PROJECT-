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
    },
    {
      'id': 'r4', 'name': 'Laneway Grill', 'suburb': 'Perth CBD', 'cuisine': 'Burgers', 'price': '$$', 'rating': 4.3,
      'lat': -31.9523, 'lng': 115.8613,
      'blurb': 'Loaded burgers, fried chicken, and late-night bites.',
      'address': '7 Murray St, Perth WA', 'tags': 'burgers,fried chicken,late night',
      'dishes': [
        { 'id': 'd7', 'name': 'Smash Double', 'price': 19, 'rating': 4.4, 'description': 'Two beef patties, American cheese, pickles, and sauce.' },
        { 'id': 'd8', 'name': 'Spicy Chicken Tenders', 'price': 16, 'rating': 4.2, 'description': 'Crunchy chicken strips with house hot sauce.' }
      ]
    },
    {
      'id': 'r5', 'name': 'Basil & Brick', 'suburb': 'Leederville', 'cuisine': 'Italian', 'price': '$$$', 'rating': 4.6,
      'lat': -31.9369, 'lng': 115.8415,
      'blurb': 'Woodfired pizza, handmade pasta, and date-night energy.',
      'address': '86 Oxford St, Leederville WA', 'tags': 'pizza,pasta,date night',
      'dishes': [
        { 'id': 'd9', 'name': 'Truffle Mushroom Pizza', 'price': 28, 'rating': 4.8, 'description': 'Woodfired base, fior di latte, mushrooms, truffle oil.' },
        { 'id': 'd10', 'name': 'Vodka Rigatoni', 'price': 27, 'rating': 4.6, 'description': 'Silky tomato vodka sauce with parmesan and basil.' }
      ]
    },
    {
      'id': 'r6', 'name': 'Glow Tea House', 'suburb': 'Cannington', 'cuisine': 'Drinks', 'price': '$', 'rating': 4.4,
      'lat': -32.0169, 'lng': 115.9351,
      'blurb': 'Bubble tea, fruit tea, and sweet snack pairings.',
      'address': '1380 Albany Hwy, Cannington WA', 'tags': 'bubble tea,fruit tea,dessert',
      'dishes': [
        { 'id': 'd11', 'name': 'Brown Sugar Pearl Milk Tea', 'price': 8, 'rating': 4.6, 'description': 'Creamy milk tea with caramelised tapioca pearls.' },
        { 'id': 'd12', 'name': 'Mango Jasmine Tea', 'price': 8, 'rating': 4.3, 'description': 'Refreshing jasmine tea with mango puree.' }
      ]
    },
    {
      'id': 'r7', 'name': 'Tonkotsu Yard', 'suburb': 'Mount Lawley', 'cuisine': 'Japanese', 'price': '$$', 'rating': 4.7,
      'lat': -31.9347, 'lng': 115.8712,
      'blurb': 'Ramen, gyoza, and quick izakaya plates with rich broths.',
      'address': '612 Beaufort St, Mount Lawley WA', 'tags': 'ramen,gyoza,noodles',
      'dishes': [
        { 'id': 'd13', 'name': 'Black Garlic Tonkotsu', 'price': 24, 'rating': 4.8, 'description': 'Pork broth, black garlic oil, chashu, egg, and spring onion.' },
        { 'id': 'd14', 'name': 'Pork Gyoza', 'price': 13, 'rating': 4.5, 'description': 'Pan-fried dumplings with bright dipping sauce.' }
      ]
    },
    {
      'id': 'r8', 'name': 'Seoul Table', 'suburb': 'East Victoria Park', 'cuisine': 'Korean', 'price': '$$', 'rating': 4.5,
      'lat': -31.9844, 'lng': 115.9002,
      'blurb': 'Korean barbecue favourites, bibimbap, and crisp fried chicken.',
      'address': '900 Albany Hwy, East Victoria Park WA', 'tags': 'korean bbq,bibimbap,kimchi',
      'dishes': [
        { 'id': 'd15', 'name': 'Beef Bibimbap', 'price': 21, 'rating': 4.5, 'description': 'Rice bowl with vegetables, beef, egg, and gochujang.' },
        { 'id': 'd16', 'name': 'Soy Garlic Chicken', 'price': 18, 'rating': 4.6, 'description': 'Crisp fried chicken glazed with soy garlic sauce.' }
      ]
    },
    {
      'id': 'r9', 'name': 'Lemongrass Lane', 'suburb': 'Subiaco', 'cuisine': 'Thai', 'price': '$$', 'rating': 4.4,
      'lat': -31.9484, 'lng': 115.8248,
      'blurb': 'Thai curries, wok noodles, and bright herb-heavy salads.',
      'address': '22 Rokeby Rd, Subiaco WA', 'tags': 'pad thai,green curry,spicy',
      'dishes': [
        { 'id': 'd17', 'name': 'Green Curry Chicken', 'price': 23, 'rating': 4.4, 'description': 'Coconut green curry with chicken, basil, and vegetables.' },
        { 'id': 'd18', 'name': 'Pad Thai Prawns', 'price': 24, 'rating': 4.3, 'description': 'Rice noodles, prawns, tamarind, peanuts, and lime.' }
      ]
    },
    {
      'id': 'r10', 'name': 'Masa Cantina', 'suburb': 'North Perth', 'cuisine': 'Mexican', 'price': '$$', 'rating': 4.5,
      'lat': -31.9277, 'lng': 115.8536,
      'blurb': 'Tacos, grilled corn, and lively share plates.',
      'address': '419 Fitzgerald St, North Perth WA', 'tags': 'tacos,quesadilla,corn',
      'dishes': [
        { 'id': 'd19', 'name': 'Birria Tacos', 'price': 20, 'rating': 4.7, 'description': 'Slow-cooked beef tacos with consommé for dipping.' },
        { 'id': 'd20', 'name': 'Elote Corn', 'price': 10, 'rating': 4.4, 'description': 'Charred corn with crema, cheese, chilli, and lime.' }
      ]
    }
]


def seed_if_empty():
    demo = User.query.filter_by(email='demo@bitescout.app').first()
    if not demo:
        demo = User(
            name='Demo User',
            username='demouser',
            email='demo@bitescout.app',
            password_hash=generate_password_hash('password123'),
            preferred_cuisine='Japanese',
            bio='I love finding hidden gems around Perth.'
        )
        db.session.add(demo)

    ava = User.query.filter_by(email='ava@example.com').first()
    if not ava:
        ava = User(
            name='Ava Tran',
            username='avatran',
            email='ava@example.com',
            password_hash=generate_password_hash('password123'),
            preferred_cuisine='Vietnamese',
            bio='Always hunting for comfort food and good coffee.'
        )
        db.session.add(ava)

    for r in RESTAURANTS:
        restaurant = db.session.get(Restaurant, r['id'])
        if not restaurant:
            restaurant = Restaurant(
                id=r['id'], name=r['name'], suburb=r['suburb'], cuisine=r['cuisine'], price=r['price'],
                rating=r['rating'], lat=r['lat'], lng=r['lng'], blurb=r['blurb'], address=r['address'], tags=r['tags']
            )
            db.session.add(restaurant)
        for d in r['dishes']:
            if not db.session.get(Dish, d['id']):
                db.session.add(Dish(restaurant_id=r['id'], **d))

    db.session.flush()
    if not Review.query.filter_by(user_id=ava.id, restaurant_id='r1', dish_id='d1').first():
        db.session.add(Review(user_id=ava.id, restaurant_id='r1', dish_id='d1', rating=5, title='Best broth I have had lately', content='Deep flavour, fresh herbs, and really good portion size.'))
    if not Review.query.filter_by(user_id=demo.id, restaurant_id='r3', dish_id='d5').first():
        db.session.add(Review(user_id=demo.id, restaurant_id='r3', dish_id='d5', rating=4, title='Fresh sushi', content='A bit pricey, but the fish quality is worth it.'))
    db.session.commit()
