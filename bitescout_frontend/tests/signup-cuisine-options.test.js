const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frontendRoot = path.join(__dirname, '..');

function loadRestaurantCuisines() {
  const dataSource = fs.readFileSync(path.join(frontendRoot, 'js', 'data.js'), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(dataSource, context);

  return [...new Set(context.window.BiteScoutData.restaurants.map(restaurant => restaurant.cuisine))]
    .sort((left, right) => left.localeCompare(right));
}

function loadSignupCuisines() {
  const signupHtml = fs.readFileSync(path.join(frontendRoot, 'signup.html'), 'utf8');
  const selectMatch = signupHtml.match(/<select[^>]*id="signupCuisine"[\s\S]*?<\/select>/);
  assert.ok(selectMatch, 'Expected the signup cuisine select to exist.');

  return [...selectMatch[0].matchAll(/<option(?<attrs>[^>]*)>(?<label>[^<]*)<\/option>/g)]
    .filter(match => !/\bvalue=""/.test(match.groups.attrs))
    .map(match => match.groups.label.trim())
    .filter(Boolean);
}

test('signup page does not hardcode cuisine options separately from the profile source', () => {
  assert.deepEqual(loadSignupCuisines(), []);
});

test('shared cuisine select renderer uses restaurant cuisine options', () => {
  global.BiteScoutData = {
    restaurants: [
      { cuisine: 'Vietnamese' },
      { cuisine: 'Cafe' },
      { cuisine: 'Vietnamese' }
    ],
    sampleUsers: [],
    sampleReviews: []
  };

  delete require.cache[require.resolve('../js/app.js')];
  const { App } = require('../js/app.js');
  const select = { innerHTML: '' };

  App.populateCuisineSelect(select, 'Choose one');

  assert.equal(
    select.innerHTML,
    '<option value="" selected>Choose one</option><option value="Cafe">Cafe</option><option value="Vietnamese">Vietnamese</option>'
  );
});
