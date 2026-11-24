import test from 'node:test';
import assert from 'node:assert/strict';
import {
  foodKey,
  loadFoodCorrections,
  sanitizeCorrection,
  saveFoodCorrection,
  removeFoodCorrection,
  applyFoodCorrection,
  foodSourceLabel,
} from './foodCorrections.js';

function stubStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: (key) => { values.delete(key); },
  };
  return values;
}

test('foodKey is stable for the same source and id', () => {
  assert.equal(foodKey({ source: 'Open Food Facts', code: '123' }), foodKey({ source: 'open food facts', code: ' 123 ' }));
  assert.notEqual(foodKey({ source: 'Open Food Facts', code: '123' }), foodKey({ source: 'USDA', code: '123' }));
});

test('sanitizeCorrection keeps useful values and drops unsafe ones', () => {
  const clean = sanitizeCorrection({
    name: '  Chicken breast ',
    brand: '',
    servingLabel: '  100 g  ',
    calories: '165.456',
    protein: -4,
    carbs: 'nope',
    fat: 3.5,
  });
  assert.deepEqual(clean, {
    name: 'Chicken breast',
    servingLabel: '100 g',
    calories: 165.46,
    fat: 3.5,
  });
});

test('corrections round-trip through storage and apply to matching food', () => {
  stubStorage();
  const food = { source: 'USDA', id: 'chicken', name: 'Chicken', per100: { calories: 999, protein: 1, carbs: 0, fat: 2 } };
  saveFoodCorrection(food, { name: 'Chicken breast', calories: 165 });
  const loaded = loadFoodCorrections();
  const corrected = applyFoodCorrection(food, loaded);
  assert.equal(corrected.name, 'Chicken breast');
  assert.equal(corrected.per100.calories, 165);
  assert.equal(corrected.corrected, true);

  removeFoodCorrection(food);
  assert.deepEqual(applyFoodCorrection(food), food);
});

test('corrupt saved corrections fall back to an empty object', () => {
  stubStorage({ xfit_food_corrections_v1: '{broken' });
  assert.deepEqual(loadFoodCorrections(), {});
});

test('a different food is left untouched', () => {
  const food = { source: 'USDA', id: 'rice', name: 'Rice' };
  const corrections = { 'usda:chicken': { name: 'Chicken breast' } };
  assert.equal(applyFoodCorrection(food, corrections), food);
});

test('source labels are readable and distinguish curated picks', () => {
  assert.equal(foodSourceLabel({ source: 'usda' }), 'USDA');
  assert.equal(foodSourceLabel({ source: 'usda', curated: true }), 'Uttar pick');
  assert.equal(foodSourceLabel({ source: 'online' }), 'Open Food Facts');
  assert.equal(foodSourceLabel({ source: 'custom' }), 'Your food');
});

test('numeric corrections override per-100 nutrition and serving size', () => {
  const food = {
    source: 'online', id: 'off-1', name: 'Snack',
    per100: { calories: 500, protein: 5, carbs: 60, fat: 20 },
    servings: [['1 pouch (40 g)', 40]],
  };
  const patched = applyFoodCorrection(food, {
    'online:off-1': { calories: 420, protein: 8, serving: 45, servingLabel: '1 pouch (45 g)' },
  });
  assert.deepEqual(patched.per100, { calories: 420, protein: 8, carbs: 60, fat: 20 });
  assert.equal(patched.servingGrams, 45);
  assert.equal(patched.servings[0][0], '1 pouch (45 g)');
  assert.equal(patched.corrected, true);
});
