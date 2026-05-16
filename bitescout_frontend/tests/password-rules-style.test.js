const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

test('password requirement text uses readable dark color', () => {
  const rule = css.match(/\.password-rules li\s*\{(?<body>[^}]+)\}/);

  assert.ok(rule, 'Expected a .password-rules li style rule.');
  assert.match(rule.groups.body, /color:\s*#6f4a3c\s*;/i);
});
