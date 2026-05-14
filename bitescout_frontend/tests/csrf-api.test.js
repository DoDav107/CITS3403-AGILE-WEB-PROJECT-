const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

test('API helper fetches and sends CSRF token on unsafe requests', () => {
  assert.match(appJs, /async ensureCsrfToken\(\)/);
  assert.match(appJs, /fetch\('\/api\/csrf-token'/);
  assert.match(appJs, /'X-CSRFToken': await this\.ensureCsrfToken\(\)/);
  assert.match(appJs, /!\['GET', 'HEAD', 'OPTIONS'\]\.includes\(method\)/);
});
