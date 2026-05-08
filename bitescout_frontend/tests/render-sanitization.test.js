const test = require('node:test');
const assert = require('node:assert/strict');

const { App } = require('../js/app.js');

test('rating display uses stars without visible numeric scores', () => {
  const html = App.renderRatingStars(4.5);

  assert.match(html, /★★★★★/);
  assert.doesNotMatch(html, />\s*4\.5\s*</);
});

test('preference recommendations reserve roughly eighty percent for preferred cuisine', () => {
  const restaurants = [
    { id: 'j1', cuisine: 'Japanese', rating: 4.2 },
    { id: 'v1', cuisine: 'Vietnamese', rating: 4.9 },
    { id: 'j2', cuisine: 'Japanese', rating: 4.8 },
    { id: 'i1', cuisine: 'Italian', rating: 4.6 },
    { id: 'j3', cuisine: 'Japanese', rating: 4.5 },
    { id: 'j4', cuisine: 'Japanese', rating: 4.7 }
  ];

  const recommendations = App.buildPreferenceRecommendations(restaurants, 'Japanese', 5);

  assert.deepEqual(recommendations.map(restaurant => restaurant.id), ['j2', 'j4', 'j3', 'j1', 'v1']);
});

test('Google place filter options include primary types and place tags', () => {
  const options = App.getGooglePlaceFilterOptions([
    { primaryType: 'restaurant', types: ['restaurant', 'food', 'sushi_restaurant'] },
    { primaryType: 'cafe', types: ['cafe', 'food', 'bakery'] },
    { primaryType: 'restaurant', types: ['restaurant', 'meal_takeaway'] }
  ]);

  assert.deepEqual(options.types, ['cafe', 'restaurant']);
  assert.deepEqual(options.tags, ['bakery', 'meal_takeaway', 'sushi_restaurant']);
});

test('Google place filter options do not duplicate broad types as tags', () => {
  const options = App.getGooglePlaceFilterOptions([
    { primaryType: 'restaurant', types: ['restaurant', 'food', 'cafe', 'ramen_restaurant'] },
    { primaryType: 'cafe', types: ['cafe', 'food', 'bar', 'bakery'] }
  ]);

  assert.deepEqual(options.types, ['bar', 'cafe', 'restaurant']);
  assert.deepEqual(options.tags, ['bakery', 'ramen_restaurant']);
});

test('Browse Google place filters combine search, type, tag, and rating', () => {
  const places = [
    {
      id: 'p1',
      name: 'Northbridge Ramen Lab',
      address: '99 Roe St, Northbridge WA',
      rating: 4.7,
      primaryType: 'restaurant',
      types: ['restaurant', 'ramen_restaurant', 'food']
    },
    {
      id: 'p2',
      name: 'City Coffee',
      address: 'Perth CBD',
      rating: 4.8,
      primaryType: 'cafe',
      types: ['cafe', 'coffee_shop', 'food']
    },
    {
      id: 'p3',
      name: 'Low Rated Ramen',
      address: 'Northbridge WA',
      rating: 3.2,
      primaryType: 'restaurant',
      types: ['restaurant', 'ramen_restaurant', 'food']
    }
  ];

  const filtered = App.filterBrowseGooglePlaces(places, {
    search: 'ramen',
    selectedType: 'restaurant',
    selectedTag: 'ramen_restaurant',
    minRating: 4
  });

  assert.deepEqual(filtered.map(place => place.id), ['p1']);
});

test('Browse Google place type filter matches primary and secondary place types', () => {
  const places = [
    {
      id: 'p1',
      name: 'Northbridge Ramen Lab',
      address: '99 Roe St, Northbridge WA',
      rating: 4.7,
      primaryType: 'japanese_restaurant',
      types: ['restaurant', 'ramen_restaurant', 'food']
    },
    {
      id: 'p2',
      name: 'City Coffee',
      address: 'Perth CBD',
      rating: 4.8,
      primaryType: 'cafe',
      types: ['cafe', 'coffee_shop', 'food']
    }
  ];

  const filtered = App.filterBrowseGooglePlaces(places, {
    selectedType: 'restaurant',
    minRating: 0
  });

  assert.deepEqual(filtered.map(place => place.id), ['p1']);
});

test('Browse Google place search matches formatted type labels', () => {
  const places = [
    {
      id: 'p1',
      name: 'Northbridge Ramen Lab',
      address: '99 Roe St, Northbridge WA',
      rating: 4.7,
      primaryType: 'japanese_restaurant',
      types: ['restaurant', 'ramen_restaurant', 'food']
    }
  ];

  const filtered = App.filterBrowseGooglePlaces(places, {
    search: 'Japanese Restaurant',
    minRating: 0
  });

  assert.deepEqual(filtered.map(place => place.id), ['p1']);
});

test('Google place card escapes fields and renders save without navigation', () => {
  const html = App.renderGooglePlaceCard({
    id: 'p-danger',
    name: '<img src=x onerror=alert(1)>',
    address: '1 <b>Bad</b> St',
    rating: 4.5,
    primaryType: 'japanese_restaurant',
    types: ['restaurant', '<script>alert(1)</script>'],
    lat: -31.95,
    lng: 115.86
  }, 2);

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img src=x onerror/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /1 &lt;b&gt;Bad&lt;\/b&gt; St/);
  assert.match(html, /class="btn btn-outline-dark btn-sm save-google-place-trigger"/);
  assert.match(html, /data-index="2"/);
  assert.match(html, />Save</);
});

test('restaurant tag links are escaped and point back to Browse filters', () => {
  const html = App.renderRestaurantTagLinks(['sushi', '<script>alert(1)</script>']);

  assert.match(html, /href="browse\.html\?tag=sushi"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script/i);
});

test('profile avatars resolve preset and default images', () => {
  const presetAvatar = App.resolveAvatarUrl('preset:avatar-sushi', 'Ava Tran');
  const defaultAvatar = App.getUserAvatarUrl({ name: 'Demo User' });

  assert.match(presetAvatar, /^https:\/\/images\.unsplash\.com\//);
  assert.match(defaultAvatar, /^https:\/\/images\.unsplash\.com\//);
  assert.notEqual(presetAvatar, defaultAvatar);
});

test('restaurant card escapes user-controlled restaurant fields', () => {
  const html = App.renderRestaurantCard({
    id: 'r-danger',
    name: '<img src=x onerror=alert(1)>',
    suburb: 'Northbridge',
    cuisine: 'Fusion<script>alert(1)</script>',
    price: '$$',
    rating: 4.5,
    address: '123 <b>Evil</b> St',
    blurb: 'Tasty <script>alert(1)</script>',
    distanceKm: 1.2
  });

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img src=x onerror/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /123 &lt;b&gt;Evil&lt;\/b&gt; St/);
});

test('review card escapes user-controlled review and profile fields', () => {
  const fakeContext = {
    getDisplayUser() {
      return { id: 'u1', name: '<script>alert(1)</script>' };
    },
    getRestaurantById() {
      return { name: '<img src=x onerror=alert(1)>' };
    },
    formatDate() {
      return '2026-04-22';
    },
    renderRatingStars: App.renderRatingStars,
    ratingWord: App.ratingWord
  };

  const html = App.renderReviewCard.call(
    fakeContext,
    {
      id: 1,
      userId: 'u1',
      restaurantId: 'r1',
      rating: 5,
      title: '<img src=x onerror=alert(1)>',
      content: 'Loved it <script>alert(1)</script>',
      createdAt: '2026-04-22T12:00:00'
    },
    false
  );

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img src=x onerror/i);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Loved it &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
