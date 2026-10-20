const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const backendNavbar = fs.readFileSync(
  path.join(__dirname, '..', '..', 'bitescout_backend', 'app', 'templates', 'partials', '_navbar.html'),
  'utf8'
);

test('theme toggle is available in both static and Flask navbars', () => {
  assert.match(appJs, /data-theme-toggle/);
  assert.match(backendNavbar, /data-theme-toggle/);
});

test('theme mode is persisted and applied through page-level attributes', () => {
  assert.match(appJs, /bitescout_theme/);
  assert.match(appJs, /document\.documentElement\.setAttribute\('data-theme'/);
  assert.match(appJs, /document\.body\.setAttribute\('data-theme'/);
  assert.match(css, /body\[data-theme="dark"\]/);
});
