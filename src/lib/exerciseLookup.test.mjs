// Run: node --test src/lib/exerciseLookup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMatcher, DEFAULT_IMG_BASE } from './exerciseLookup.js';

const data = JSON.parse(fs.readFileSync(new URL('../data/exerciseIndex.json', import.meta.url), 'utf8'));
const m = createMatcher(data);
const names = (n) => m.findAll(n).map((e) => e.name);

test('every exercise in the built-in workouts has a demo', () => {
  for (const n of ['Bicep Curls', 'Hammer Curls', 'Lateral Raises', 'Dumbbell Ground to Overhead', '105 Jumps Warm-Up',
    'Core Circuit Round 4', 'Core Circuit Round 7 + Ab Hold', 'Push-Ups or Diamond Push-Ups', 'Squats or Bulgarian Split Squats']) {
    assert.ok(m.findAll(n).length > 0, `no demo for "${n}"`);
  }
});

test('"X or Y" names return both alternatives', () => {
  assert.deepEqual(names('Push-Ups or Diamond Push-Ups'), ['Pushups', 'Push-Ups - Close Triceps Position']);
  assert.equal(names('Squats or Bulgarian Split Squats').length, 2);
});

test('common names pick the sensible variation', () => {
  assert.deepEqual(names('Deadlift'), ['Barbell Deadlift']);
  assert.deepEqual(names('Bicep Curls'), ['Dumbbell Bicep Curl']);
  assert.deepEqual(names('Russian Twists'), ['Russian Twist']);
  assert.deepEqual(names('Plank'), ['Plank']);
});

test('unknown / non-exercise names return nothing instead of a wrong demo', () => {
  for (const n of ['Rest', 'Cool Down', 'Stretching', 'Zxqv Thing', '', null, undefined]) assert.deepEqual(m.findAll(n), []);
});

test('frames are pinned-commit URLs and muscles are populated', () => {
  const e = m.find('Bicep Curls');
  assert.equal(e.frames[0], `${DEFAULT_IMG_BASE}/Dumbbell_Bicep_Curl/0.jpg`);
  assert.ok(e.primary.includes('biceps'));
});

test('image base can be overridden', () => {
  assert.ok(createMatcher(data, 'https://cdn.example/x').find('Plank').frames[1].startsWith('https://cdn.example/x/Plank/1'));
});

test('every override id exists in the dataset', () => {
  const src = fs.readFileSync(new URL('./exerciseLookup.js', import.meta.url), 'utf8');
  const have = new Set(data.exercises.map((e) => e[0]));
  const block = src.slice(src.indexOf('const OVERRIDES'), src.indexOf('const STOP'));
  const ids = [...block.matchAll(/'([A-Za-z0-9_()\-]+)'/g)].map((x) => x[1]);
  assert.ok(ids.length > 10);
  for (const id of ids) assert.ok(have.has(id), `override id missing from dataset: ${id}`);
});
