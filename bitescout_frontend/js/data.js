
window.BiteScoutData = {
  restaurants: [
    {
      id: 'r1',
      name: 'Saigon Alley',
      suburb: 'Northbridge',
      cuisine: 'Vietnamese',
      price: '$$',
      rating: 4.7,
      lat: -31.9467,
      lng: 115.8587,
      blurb: 'Modern Vietnamese street food with pho, rice bowls, and fresh iced drinks.',
      address: '12 James St, Northbridge WA',
      tags: ['noodles', 'banh mi', 'iced coffee'],
      dishes: [
        { id: 'd1', name: 'Special Beef Pho', price: 22, rating: 4.8, description: 'Rich broth, tender beef, herbs, and fresh noodles.' },
        { id: 'd2', name: 'Crispy Pork Banh Mi', price: 14, rating: 4.6, description: 'Crunchy pork belly with pickled vegetables and pâté.' }
      ]
    },
    {
      id: 'r2',
      name: 'Harbour Roast',
      suburb: 'Fremantle',
      cuisine: 'Cafe',
      price: '$$',
      rating: 4.5,
      lat: -32.0569,
      lng: 115.7439,
      blurb: 'Brunch and specialty coffee spot near the port.',
      address: '34 Market St, Fremantle WA',
      tags: ['brunch', 'coffee', 'pastries'],
      dishes: [
        { id: 'd3', name: 'Chilli Scramble', price: 23, rating: 4.5, description: 'Soft eggs, sourdough, chilli oil, feta, and herbs.' },
        { id: 'd4', name: 'Cold Brew Float', price: 9, rating: 4.4, description: 'Smooth cold brew with vanilla ice cream.' }
      ]
    },
    {
      id: 'r3',
      name: 'Sora Sushi Bar',
      suburb: 'Victoria Park',
      cuisine: 'Japanese',
      price: '$$$',
      rating: 4.8,
      lat: -31.9737,
      lng: 115.9015,
      blurb: 'Fresh sushi, sashimi, and omakase-inspired plates.',
      address: '198 Albany Hwy, Victoria Park WA',
      tags: ['sushi', 'sashimi', 'matcha'],
      dishes: [
        { id: 'd5', name: 'Aburi Salmon Roll', price: 24, rating: 4.9, description: 'Torched salmon roll with mayo, citrus, and tobiko.' },
        { id: 'd6', name: 'Matcha Cheesecake', price: 12, rating: 4.7, description: 'Creamy matcha cheesecake with sesame crumble.' }
      ]
    },
    {
      id: 'r4',
      name: 'Laneway Grill',
      suburb: 'Perth CBD',
      cuisine: 'Burgers',
      price: '$$',
      rating: 4.3,
      lat: -31.9523,
      lng: 115.8613,
      blurb: 'Loaded burgers, fried chicken, and late-night bites.',
      address: '7 Murray St, Perth WA',
      tags: ['burgers', 'fried chicken', 'late night'],
      dishes: [
        { id: 'd7', name: 'Smash Double', price: 19, rating: 4.4, description: 'Two beef patties, American cheese, pickles, and sauce.' },
        { id: 'd8', name: 'Spicy Chicken Tenders', price: 16, rating: 4.2, description: 'Crunchy chicken strips with house hot sauce.' }
      ]
    },
    {
      id: 'r5',
      name: 'Basil & Brick',
      suburb: 'Leederville',
      cuisine: 'Italian',
      price: '$$$',
      rating: 4.6,
      lat: -31.9369,
      lng: 115.8415,
      blurb: 'Woodfired pizza, handmade pasta, and date-night energy.',
      address: '86 Oxford St, Leederville WA',
      tags: ['pizza', 'pasta', 'date night'],
      dishes: [
        { id: 'd9', name: 'Truffle Mushroom Pizza', price: 28, rating: 4.8, description: 'Woodfired base, fior di latte, mushrooms, truffle oil.' },
        { id: 'd10', name: 'Vodka Rigatoni', price: 27, rating: 4.6, description: 'Silky tomato vodka sauce with parmesan and basil.' }
      ]
    },
    {
      id: 'r6',
      name: 'Glow Tea House',
      suburb: 'Cannington',
      cuisine: 'Drinks',
      price: '$',
      rating: 4.4,
      lat: -32.0169,
      lng: 115.9351,
      blurb: 'Bubble tea, fruit tea, and sweet snack pairings.',
      address: '1380 Albany Hwy, Cannington WA',
      tags: ['bubble tea', 'fruit tea', 'dessert'],
      dishes: [
        { id: 'd11', name: 'Brown Sugar Pearl Milk Tea', price: 8, rating: 4.6, description: 'Creamy milk tea with caramelised tapioca pearls.' },
        { id: 'd12', name: 'Mango Jasmine Tea', price: 8, rating: 4.3, description: 'Refreshing jasmine tea with mango puree.' }
      ]
    }
  ],
  sampleUsers: [
    { id: 'u-demo-1', name: 'Ava Tran', username: 'avatran', preferredCuisine: 'Vietnamese', bio: 'Always hunting for comfort food and good coffee.' },
    { id: 'u-demo-2', name: 'Luca Marino', username: 'lucamarino', preferredCuisine: 'Italian', bio: 'Pizza, pasta, and dessert are my main priorities.' }
  ],
  sampleReviews: [
    { id: 'sr1', userId: 'u-demo-1', restaurantId: 'r1', dishId: 'd1', rating: 5, title: 'Best broth I have had lately', content: 'Deep flavour, fresh herbs, and really good portion size.', createdAt: '2026-04-06T11:00:00' },
    { id: 'sr2', userId: 'u-demo-2', restaurantId: 'r5', dishId: 'd9', rating: 5, title: 'Excellent pizza base', content: 'Crispy edges, good mushroom balance, and not too oily.', createdAt: '2026-04-05T18:30:00' },
    { id: 'sr3', userId: 'u-demo-1', restaurantId: 'r3', dishId: '', rating: 4, title: 'Fresh sushi and great service', content: 'A bit pricey, but the fish quality is worth it.', createdAt: '2026-04-07T13:45:00' }
  ]
};
