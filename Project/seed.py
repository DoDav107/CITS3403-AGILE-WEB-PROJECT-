from app import create_app
from app.extensions import db
from app.models import Dish, Restaurant


SEED_RESTAURANTS = [
    {
        "name": "Ember Lane",
        "cuisine_type": "Modern Australian",
        "suburb": "Northbridge",
        "description": "Open-kitchen dining with woodfire-focused sharing plates.",
        "dishes": [
            {"name": "Coal-grilled prawns", "description": "Preserved lemon butter and dill oil"},
            {"name": "Half chicken over embers", "description": "Burnt honey glaze"},
        ],
    },
    {
        "name": "Harbor Leaf",
        "cuisine_type": "Thai",
        "suburb": "Fremantle",
        "description": "Bright coastal Thai with seafood and herbs.",
        "dishes": [
            {"name": "Green papaya salad", "description": "Peanuts, lime, crisp herbs"},
            {"name": "Charcoal squid skewers", "description": "Nam jim and spring onion"},
        ],
    },
    {
        "name": "Noodle Theory",
        "cuisine_type": "Japanese",
        "suburb": "Perth CBD",
        "description": "Compact ramen and hand-roll venue for late-night comfort.",
        "dishes": [
            {"name": "Black garlic tonkotsu", "description": "Rich broth and ajitama"},
            {"name": "Yuzu shio ramen", "description": "Clear broth with chicken oil"},
        ],
    },
]


def seed_restaurants() -> int:
    created_count = 0
    for item in SEED_RESTAURANTS:
        existing = Restaurant.query.filter_by(name=item["name"]).first()
        if existing:
            continue

        restaurant = Restaurant(
            name=item["name"],
            cuisine_type=item["cuisine_type"],
            suburb=item["suburb"],
            description=item["description"],
        )
        db.session.add(restaurant)
        db.session.flush()

        for dish_data in item["dishes"]:
            db.session.add(
                Dish(
                    restaurant_id=restaurant.id,
                    name=dish_data["name"],
                    description=dish_data["description"],
                )
            )

        created_count += 1

    db.session.commit()
    return created_count


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        created = seed_restaurants()
        print(f"Seed complete. Added {created} restaurants.")
