// Builds src/data/foods.json from the USDA National Nutrient Database for Standard Reference, Release 28
// (public-domain US government data). Source files come from the npm package "fda-nutrient-database".
// Usage: node scripts/build-food-db.mjs <dir containing FOOD_DES.txt and ABBREV.txt>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/build-food-db.mjs <dir with FOOD_DES.txt + ABBREV.txt>'); process.exit(1); }

const rows = (file) =>
  fs.readFileSync(path.join(dir, file), 'latin1').split(/\r?\n/).filter(Boolean)
    .map((l) => l.split('^').map((c) => c.replace(/^~|~$/g, '')));

const DROP_GROUPS = new Set(['0300', '3500']);          // baby foods, Native American/Alaska Native foods
const num = (v) => (v === '' || v == null ? null : Number(v));
const r1 = (n) => Math.round(n * 10) / 10;

const des = new Map();                                    // NDB → { group, long, com, manu }
for (const c of rows('FOOD_DES.txt')) des.set(c[0], { group: c[1], long: c[2], com: c[4], manu: c[5] });

const foods = [];
for (const c of rows('ABBREV.txt')) {
  const d = des.get(c[0]);
  if (!d || DROP_GROUPS.has(d.group)) continue;
  const kcal = num(c[3]), protein = num(c[4]), fat = num(c[5]), carbs = num(c[7]);
  if (kcal == null || protein == null || fat == null || carbs == null) continue;
  const n = c.length;                                     // last 5 columns: GmWt_1, Desc_1, GmWt_2, Desc_2, Refuse_Pct
  const servings = [];
  for (const [g, label] of [[c[n - 5], c[n - 4]], [c[n - 3], c[n - 2]]]) {
    const grams = num(g);
    if (grams && grams > 0 && label) servings.push([label.trim(), r1(grams)]);
  }
  foods.push({
    id: Number(c[0]), name: d.long, com: d.com || '', branded: d.manu ? 1 : 0, group: d.group,
    kcal: Math.round(kcal), p: r1(protein), c: r1(carbs), f: r1(fat), fiber: num(c[8]) == null ? null : r1(num(c[8])), servings,
  });
}
fs.mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
const out = {
  source: 'USDA National Nutrient Database for Standard Reference, Release 28 (public domain)',
  // [id, name, kcal, protein, carbs, fat, servings, flags]  — all nutrition per 100 g
  foods: foods.map((x) => [x.id, x.name, x.kcal, x.p, x.c, x.f, x.servings, x.branded ? 1 : 0, x.com || 0]),
};
fs.writeFileSync(new URL('../src/data/foods.json', import.meta.url), JSON.stringify(out));
console.log(`wrote ${foods.length} foods`);
