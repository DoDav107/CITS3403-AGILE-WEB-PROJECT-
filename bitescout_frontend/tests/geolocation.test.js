const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildLocationErrorMessage,
  isGeolocationOriginAllowed
} = require('../js/app.js');

test('allows browser geolocation on localhost-style origins without HTTPS', () => {
  assert.equal(
    isGeolocationOriginAllowed({ hostname: '127.0.0.1', isSecureContext: false }),
    true
  );
  assert.equal(
    isGeolocationOriginAllowed({ hostname: 'localhost', isSecureContext: false }),
    true
  );
});

test('rejects browser geolocation on insecure LAN origins', () => {
  assert.equal(
    isGeolocationOriginAllowed({ hostname: '192.168.1.20', isSecureContext: false }),
    false
  );
});

test('shows a permission guidance message on secure local origins', () => {
  const message = buildLocationErrorMessage(
    { code: 1 },
    { hostname: '127.0.0.1', isSecureContext: true }
  );

  assert.match(message, /Allow location access|browser settings|site settings/i);
  assert.doesNotMatch(message, /Try localhost or HTTPS/i);
});

test('shows a secure-context hint on insecure non-local origins', () => {
  const message = buildLocationErrorMessage(
    { code: 1 },
    { hostname: 'example.com', isSecureContext: false }
  );

  assert.match(message, /HTTPS|localhost|127\.0\.0\.1/i);
});

test('shows an availability message when the device cannot provide a position', () => {
  const message = buildLocationErrorMessage(
    { code: 2 },
    { hostname: '127.0.0.1', isSecureContext: true }
  );

  assert.match(message, /unavailable|Location Services|try again|search manually/i);
});
