// Builds src/data/exerciseIndex.json from the Free Exercise DB (public domain / Unlicense).
// Usage: node scripts/build-exercise-index.mjs path/to/free-exercise-db/dist/exercises.json <commit-sha>
// Source: https://github.com/yuhonas/free-exercise-db
import fs from 'node:fs';

const [, , src, commit = 'main'] = process.argv;
if (!src) { console.error('usage: node build-exercise-index.mjs <exercises.json> [commit]'); process.exit(1); }

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const muscles = [...new Set(raw.flatMap((e) => [...e.primaryMuscles, ...e.secondaryMuscles]))].sort();
const mi = Object.fromEntries(muscles.map((m, i) => [m, i]));

const exercises = raw
  .filter((e) => Array.isArray(e.images) && e.images.length >= 2)   // need 2 frames to animate
  .map((e) => [e.id, e.name, e.equipment || '', e.primaryMuscles.map((m) => mi[m]), e.secondaryMuscles.map((m) => mi[m])]);

fs.writeFileSync(
  new URL('../src/data/exerciseIndex.json', import.meta.url),
  JSON.stringify({ source: 'yuhonas/free-exercise-db', commit, muscles, exercises })
);
console.log(`wrote ${exercises.length} exercises (skipped ${raw.length - exercises.length} without 2 frames)`);
