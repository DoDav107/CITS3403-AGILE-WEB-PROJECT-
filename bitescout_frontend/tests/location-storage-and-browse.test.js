const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  LOCATION_STORAGE_MAX_AGE_MS,
  normalizeStoredUserLocation
} = require('../js/app.js');

test('keeps a recent stored location', () => {
  const now = 1_700_000_000_000;
  const location = normalizeStoredUserLocation(
    {
      lat: -31.95,
      lng: 115.86,
      savedAt: now - 60_000
    },
    now
  );

  assert.deepEqual(location, { lat: -31.95, lng: 115.86 });
});

test('drops a stale stored location', () => {
  const now = 1_700_000_000_000;
  const location = normalizeStoredUserLocation(
    {
      lat: -31.95,
      lng: 115.86,
      savedAt: now - LOCATION_STORAGE_MAX_AGE_MS - 1
    },
    now
  );

  assert.equal(location, null);
});

test('drops legacy stored locations without a timestamp', () => {
  const location = normalizeStoredUserLocation({ lat: -31.95, lng: 115.86 }, 1_700_000_000_000);
  assert.equal(location, null);
});

test('browse page exposes a manual location fallback UI', () => {
  const browseHtml = fs.readFileSync(
    path.join(__dirname, '..', 'browse.html'),
    'utf8'
  );

  assert.match(browseHtml, /id="browseManualLocationInput"/);
  assert.match(browseHtml, /id="browseSearchLocationBtn"/);
  assert.match(browseHtml, /id="browseClearLocationBtn"/);
});
