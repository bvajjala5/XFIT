// Run: node --test src/lib/foodSearch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createFoodSearch, calcNutrition, compositeFromItems, defaultGrams, tokenize } from './foodSearch.js';
import { CURATED } from './curatedFoods.js';

const data = JSON.parse(fs.readFileSync(new URL('../data/foods.json', import.meta.url), 'utf8'));
const fs_ = createFoodSearch(data, CURATED);
const first = (q) => { const r = fs_.search(q); return (r.curated[0] || r.usda[0]) ; };
const nm = (f) => f?.label || f?.name;

test('database loaded', () => assert.ok(fs_.size > 8000));

test('every curated id exists in the USDA data', () => {
  const missing = CURATED.filter(([id]) => !fs_.byId.has(id)).map(([id, l]) => `${id} ${l}`);
  assert.deepEqual(missing, []);
});

test('THE BUG: "banana" returns the banana itself first, not banana cereal/oats', () => {
  for (const q of ['banana', 'bananas', 'Banana', ' banan ']) {
    const r = fs_.search(q);
    assert.equal(nm(r.curated[0]), 'Banana', q);
    assert.equal(r.curated[0].per100.calories, 89);
  }
  const all = fs_.search('banana');
  const top5 = [...all.curated, ...all.usda].slice(0, 5).map(nm);
  assert.ok(!top5.slice(0, 2).some((n) => /cereal|oat|muffin|bread/i.test(n)), top5.join(' | '));
});

test('everyday searches put the obvious food first', () => {
  const expect = { chicken: 'Chicken breast, cooked', rice: 'White rice, cooked', egg: 'Egg, hard-boiled', eggs: 'Egg, hard-boiled',
    apple: 'Apple', oats: 'Oats, dry', pb: 'Peanut butter', 'peanut butter': 'Peanut butter', milk: 'Whole milk', 'greek yogurt': 'Greek yogurt, plain nonfat',
    broccoli: 'Broccoli, cooked', salmon: 'Salmon, cooked', pasta: 'Pasta, cooked', steak: 'Sirloin steak, cooked', 'sweet potato': 'Sweet potato, baked',
    avocado: 'Avocado', coffee: 'Black coffee', oatmeal: 'Oatmeal, cooked', tuna: 'Tuna, canned in water', 'protein powder': 'Whey protein powder' };
  for (const [q, want] of Object.entries(expect)) assert.equal(nm(first(q)), want, `"${q}"`);
});

test('typing works as you go (prefix on last word)', () => {
  assert.equal(nm(first('chick')), 'Chicken breast, cooked');
  assert.equal(nm(first('straw')), 'Strawberries');
});

test('foods not in the everyday list still come from the full USDA list', () => {
  const r = fs_.search('kale');
  assert.ok(r.usda.length > 0 && /kale/i.test(r.usda[0].name), r.usda[0]?.name);
  assert.ok(fs_.search('xylophone').usda.length === 0);
  assert.deepEqual(fs_.search('   '), { curated: [], usda: [] });
});

test('branded items rank below plain foods', () => {
  const r = fs_.search('corn');
  const idxBranded = r.usda.findIndex((f) => f.branded);
  const idxPlain = r.usda.findIndex((f) => !f.branded);
  assert.ok(idxPlain !== -1 && (idxBranded === -1 || idxPlain < idxBranded));
});

test('"chicken and rice" becomes a two-ingredient meal', () => {
  const m = fs_.parseMealQuery('chicken and rice');
  assert.ok(m);
  assert.deepEqual(m.items.map((i) => i.food.label), ['Chicken breast, cooked', 'White rice, cooked']);
  assert.equal(m.title, 'Chicken breast + White rice');
  assert.ok(m.items.every((i) => i.grams > 0));
  assert.equal(fs_.parseMealQuery('eggs + toast').items.length, 2);
  assert.equal(fs_.parseMealQuery('banana'), null);
  assert.equal(fs_.parseMealQuery('chicken and zzzqqq'), null);
});

test('nutrition maths', () => {
  const banana = fs_.byId.get(9040);
  assert.deepEqual(calcNutrition(banana.per100, 118), { calories: 105, protein: 1.3, carbs: 26.9, fat: 0.4 });   // 1 medium banana ≈ 105 kcal
  const meal = compositeFromItems([{ food: fs_.byId.get(5064), grams: 140 }, { food: fs_.byId.get(20045), grams: 158 }]);
  assert.ok(meal.calories > 420 && meal.calories < 450, String(meal.calories));
  assert.equal(meal.grams, 298);
  assert.ok(Math.abs(meal.per100.calories * 2.98 - meal.calories) < 4);
  assert.ok(defaultGrams(banana) > 0);
});

test('tokenizer', () => {
  assert.deepEqual(tokenize('Tomatoes, Berries & Peaches'), ['tomato', 'berry', 'peach']);
  assert.deepEqual(tokenize('chicken and rice', { query: true }), ['chicken', 'rice']);
});
