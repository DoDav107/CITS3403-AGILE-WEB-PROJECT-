const test = require('node:test');
const assert = require('node:assert/strict');

const { App } = require('../js/app.js');

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
    getDish() {
      return { name: '<b>Danger Dish</b>' };
    },
    formatDate() {
      return '2026-04-22';
    }
  };

  const html = App.renderReviewCard.call(
    fakeContext,
    {
      id: 1,
      userId: 'u1',
      restaurantId: 'r1',
      dishId: 'd1',
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
  assert.match(html, /&lt;b&gt;Danger Dish&lt;\/b&gt;/);
  assert.match(html, /Loved it &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
