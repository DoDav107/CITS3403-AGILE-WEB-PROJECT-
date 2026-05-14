const test = require('node:test');
const assert = require('node:assert/strict');

const { App } = require('../js/app.js');

function jsonResponse(payload, ok = true) {
  return {
    ok,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : '';
      }
    },
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

test('unsafe API requests include a CSRF token header', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  App.state.csrfToken = null;
  global.fetch = async (path, config = {}) => {
    calls.push({ path, config });
    if (path === '/api/csrf-token') {
      return jsonResponse({ csrfToken: 'secure-test-token' });
    }
    return jsonResponse({ ok: true });
  };

  try {
    await App.api('/api/reviews', { method: 'POST', body: { title: 'Great' } });
  } finally {
    global.fetch = originalFetch;
    App.state.csrfToken = null;
  }

  assert.equal(calls[0].path, '/api/csrf-token');
  assert.equal(calls[1].path, '/api/reviews');
  assert.equal(calls[1].config.headers['X-CSRFToken'], 'secure-test-token');
});
