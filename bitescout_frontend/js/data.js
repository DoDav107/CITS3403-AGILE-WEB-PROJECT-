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
      tags: ['noodles', 'banh mi', 'iced coffee']
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
      tags: ['brunch', 'coffee', 'pastries']
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
      tags: ['sushi', 'sashimi', 'matcha']
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
      tags: ['burgers', 'fried chicken', 'late night']
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
      tags: ['pizza', 'pasta', 'date night']
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
      tags: ['bubble tea', 'fruit tea', 'dessert']
    },
    {
      id: 'r7',
      name: 'Tonkotsu Yard',
      suburb: 'Mount Lawley',
      cuisine: 'Japanese',
      price: '$$',
      rating: 4.7,
      lat: -31.9347,
      lng: 115.8712,
      blurb: 'Ramen and quick izakaya-style plates with rich broths.',
      address: '612 Beaufort St, Mount Lawley WA',
      tags: ['ramen', 'noodles', 'quick eats']
    },
    {
      id: 'r8',
      name: 'Seoul Table',
      suburb: 'East Victoria Park',
      cuisine: 'Korean',
      price: '$$',
      rating: 4.5,
      lat: -31.9844,
      lng: 115.9002,
      blurb: 'Korean barbecue favourites, bibimbap, and crisp fried chicken.',
      address: '900 Albany Hwy, East Victoria Park WA',
      tags: ['korean bbq', 'bibimbap', 'kimchi']
    },
    {
      id: 'r9',
      name: 'Lemongrass Lane',
      suburb: 'Subiaco',
      cuisine: 'Thai',
      price: '$$',
      rating: 4.4,
      lat: -31.9484,
      lng: 115.8248,
      blurb: 'Thai curries, wok noodles, and bright herb-heavy salads.',
      address: '22 Rokeby Rd, Subiaco WA',
      tags: ['pad thai', 'green curry', 'spicy']
    },
    {
      id: 'r10',
      name: 'Masa Cantina',
      suburb: 'North Perth',
      cuisine: 'Mexican',
      price: '$$',
      rating: 4.5,
      lat: -31.9277,
      lng: 115.8536,
      blurb: 'Tacos, grilled corn, and lively share plates.',
      address: '419 Fitzgerald St, North Perth WA',
      tags: ['tacos', 'quesadilla', 'corn']
    }
  ],
  sampleUsers: [
    { id: 'u-demo-1', name: 'Ava Tran', username: 'avatran', preferredCuisine: 'Vietnamese', bio: 'Always hunting for comfort food and good coffee.', avatarUrl: 'preset:avatar-noodles' },
    { id: 'u-demo-2', name: 'Luca Marino', username: 'lucamarino', preferredCuisine: 'Italian', bio: 'Pizza, pasta, and dessert are my main priorities.', avatarUrl: 'preset:avatar-pizza' }
  ],
  sampleReviews: [
    { id: 'sr1', userId: 'u-demo-1', restaurantId: 'r1', rating: 5, title: 'Best broth I have had lately', content: 'Deep flavour, fresh herbs, and really good portion size.', createdAt: '2026-04-06T11:00:00' },
    { id: 'sr2', userId: 'u-demo-2', restaurantId: 'r5', rating: 5, title: 'Excellent pizza base', content: 'Crispy edges, good mushroom balance, and not too oily.', createdAt: '2026-04-05T18:30:00' },
    { id: 'sr3', userId: 'u-demo-1', restaurantId: 'r3', rating: 4, title: 'Fresh sushi and great service', content: 'A bit pricey, but the fish quality is worth it.', createdAt: '2026-04-07T13:45:00' }
  ]
};
