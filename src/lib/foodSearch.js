// Food search over the bundled USDA database. Pure functions (no React / Firebase) so they're unit-tested in Node.
// A "food" object everywhere in the app looks like:
//   { id, name, label?, brand?, source: 'usda'|'custom'|'online'|'meal', per100: {calories, protein, carbs, fat}, servings: [[label, grams], ...] }

const QUERY_STOP = new Set(['and', 'with', 'of', 'the', 'a', 'an', 'w']);

/** Simple English plural stemmer: bananas→banana, berries→berry, tomatoes→tomato, peaches→peach. */
export function stem(w) {
  if (w.length <= 3) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (/(ches|shes|sses|xes|oes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

export function tokenize(s, { query = false } = {}) {
  const t = String(s || '').toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim();
  if (!t) return [];
  return t.split(' ').filter((w) => !(query && QUERY_STOP.has(w))).map(stem);
}

export function calcNutrition(per100, grams) {
  const f = (Number(grams) || 0) / 100;
  const r1 = (n) => Math.round(n * 10) / 10;
  return { calories: Math.round(per100.calories * f), protein: r1(per100.protein * f), carbs: r1(per100.carbs * f), fat: r1(per100.fat * f) };
}

/** Add up several {food, grams} rows into one loggable food. */
export function compositeFromItems(items) {
  const tot = items.reduce((a, { food, grams }) => {
    const n = calcNutrition(food.per100, grams);
    return { calories: a.calories + n.calories, protein: a.protein + n.protein, carbs: a.carbs + n.carbs, fat: a.fat + n.fat, grams: a.grams + (Number(grams) || 0) };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 });
  const g = tot.grams || 1;
  const r1 = (n) => Math.round(n * 10) / 10;
  return {
    grams: tot.grams,
    calories: Math.round(tot.calories), protein: r1(tot.protein), carbs: r1(tot.carbs), fat: r1(tot.fat),
    per100: { calories: Math.round((tot.calories / g) * 100), protein: r1((tot.protein / g) * 100), carbs: r1((tot.carbs / g) * 100), fat: r1((tot.fat / g) * 100) },
  };
}

/** A sensible starting amount for a food: its first "cup / slice / medium / tbsp…" serving, otherwise 100 g. */
export function defaultGrams(food) {
  const hit = (food.servings || []).find(([label]) => /cup|slice|medium|large|piece|oz|tbsp|fillet|patty|unit/i.test(label));
  return Math.round((hit ? hit[1] : 100) || 100);
}

export function createFoodSearch(data, curated) {
  const foods = data.foods.map(([id, name, kcal, p, c, f, servings, branded, com]) => {
    const segs = name.split(',');
    return {
      id, name, source: 'usda', branded: !!branded, servings,
      per100: { calories: kcal, protein: p, carbs: c, fat: f },
      toks: tokenize(name + (com ? ' ' + com : '')),
      firstToks: tokenize(segs[0]),
      nSegs: segs.length,
    };
  });
  const byId = new Map(foods.map((f) => [f.id, f]));

  const cur = [];
  curated.forEach(([id, label, ...aliases], idx) => {
    const base = byId.get(id);
    if (!base) return;
    cur.push({
      food: { ...base, label, curated: true },
      idx,
      labelToks: tokenize(label),
      aliasToks: aliases.map((a) => tokenize(a)),
      allToks: new Set([...tokenize(label), ...aliases.flatMap((a) => tokenize(a))]),
    });
  });

  // every query token must be matched; the last one may be a prefix (so results appear while typing)
  const matchesAll = (qT, toks) =>
    qT.every((t, i) => toks.some((x) => (i === qT.length - 1 ? x.startsWith(t) : x === t)));
  const sameSet = (a, b) => a.length === b.length && a.every((t) => b.includes(t));

  function search(text, { limit = 30, curatedLimit = 6 } = {}) {
    const qT = tokenize(text, { query: true });
    if (qT.length === 0) return { curated: [], usda: [] };

    // 1) everyday foods
    const curHits = [];
    for (const c of cur) {
      let score = 0;
      if (c.aliasToks.some((a) => sameSet(a, qT))) score = 1000;
      else if (sameSet(c.labelToks, qT)) score = 950;
      else if (matchesAll(qT, c.labelToks) && c.labelToks[0] === qT[0]) score = 800;
      else if (c.aliasToks.some((a) => matchesAll(qT, a))) score = 700;
      else if (matchesAll(qT, [...c.allToks])) score = 500;
      if (score) curHits.push({ food: c.food, score: score - c.idx / 1000 });
    }
    curHits.sort((a, b) => b.score - a.score);
    const curated = curHits.slice(0, curatedLimit).map((h) => h.food);
    const curatedIds = new Set(curated.map((f) => f.id));

    // 2) the full USDA list
    const hits = [];
    for (const f of foods) {
      if (curatedIds.has(f.id) || !matchesAll(qT, f.toks)) continue;
      let s = 0;
      const first = f.firstToks;
      if (sameSet(first, qT)) s += 600;                                  // "Bananas, raw" for "banana"
      else if (matchesAll(qT, first)) s += 350 - (first.length - qT.length) * 20;
      else if (first.includes(qT[0])) s += 120;
      s -= f.nSegs * 6;
      s -= Math.max(0, f.toks.length - qT.length) * 1.2;
      if (f.branded) s -= 150;
      if (/^USDA Commodity/i.test(f.name)) s -= 60;
      hits.push({ f, s });
    }
    hits.sort((a, b) => b.s - a.s || a.f.name.length - b.f.name.length);
    return { curated, usda: hits.slice(0, Math.max(0, limit - curated.length)).map((h) => h.f) };
  }

  /** Best single match for a phrase — used when turning "chicken and rice" into ingredients. */
  const top = (text) => {
    const r = search(text, { limit: 3, curatedLimit: 3 });
    return r.curated[0] || r.usda[0] || null;
  };

  /** "chicken and rice" / "eggs + toast" → { title, items:[{food, grams}] } or null if it isn't a multi-food phrase. */
  function parseMealQuery(text) {
    const parts = String(text || '').split(/\s*(?:\band\b|\bwith\b|\bw\/|\+|&|,|\/)\s*/i).map((s) => s.trim()).filter((s) => s.length >= 2);
    if (parts.length < 2 || parts.length > 5) return null;
    const items = [];
    for (const p of parts) {
      const food = top(p);
      if (!food) return null;
      items.push({ food, grams: defaultGrams(food) });
    }
    const title = items.map(({ food }, i) => (food.label || parts[i]).replace(/,.*$/, '')).join(' + ');
    return { title, items };
  }

  return { search, top, parseMealQuery, byId, size: foods.length };
}
