// Matches an exercise name from the app (seeded, user-typed, or AI-generated) to an entry in the
// Free Exercise DB (public domain, https://github.com/yuhonas/free-exercise-db) so we can show
// its two demo frames and the muscles it works.
//
// Pure functions only (no React / no Vite-only imports) so they can be unit-tested in Node.

// Base URL for the demo photos. Pinned to a commit so images never change underneath us.
// Override with VITE_EXERCISE_IMG_BASE (e.g. a jsDelivr or your own CDN URL ending in /exercises).
export const DEFAULT_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises';

// ── Hand-picked matches for moves where fuzzy matching would pick the wrong variation ────────────
// pattern is tested against the lower-cased exercise name; ids are Free Exercise DB ids.
const OVERRIDES = [
  { re: /core circuit/, ids: ['Bodyweight_Squat', 'Butt_Lift_Bridge', 'Russian_Twist'] },
  { re: /jump(s|ing)?\b.*warm|warm.*jump|jumping jack|jump rope/, ids: ['Star_Jump', 'Rope_Jumping'] },
  { re: /diamond/, ids: ['Push-Ups_-_Close_Triceps_Position'] },
  { re: /bulgarian/, ids: ['Split_Squats'] },
  { re: /ground to overhead|dumbbell (clean|thruster)/, ids: ['Clean_and_Press', 'Dumbbell_Clean'] },
  { re: /^deadlifts?$|^barbell deadlifts?$/, ids: ['Barbell_Deadlift'] },
  { re: /^(barbell |flat )?bench press(es)?$/, ids: ['Barbell_Bench_Press_-_Medium_Grip'] },
  { re: /^sit[\s-]?ups?$/, ids: ['Sit-Up'] },
  { re: /^calf raises?$|^standing calf raises?$/, ids: ['Standing_Dumbbell_Calf_Raise'] },
  { re: /bicycle crunch/, ids: ['Air_Bike'] },
  { re: /^(chest )?fl(y|ye|ies|yes)s?$|^dumbbell fl(y|ye)s?$/, ids: ['Dumbbell_Flyes'] },
  { re: /^walking lunges?$/, ids: ['Bodyweight_Walking_Lunge'] },
  { re: /glute bridge|hip bridge/, ids: ['Butt_Lift_Bridge'] },
  { re: /^(dumbbell |db |bent[\s-]?over )?rows?$/, ids: ['Bent_Over_Two-Dumbbell_Row'] },
  { re: /^lat pull[\s-]?downs?$/, ids: ['Wide-Grip_Lat_Pulldown'] },
  { re: /skull ?crushers?/, ids: ['EZ-Bar_Skullcrusher'] },
  { re: /^(tricep|triceps) dips?$|^dips?$/, ids: ['Dips_-_Triceps_Version'] },
  { re: /^leg raises?$/, ids: ['Flat_Bench_Lying_Leg_Raise'] },
  { re: /^(bicep|biceps) curls?$/, ids: ['Dumbbell_Bicep_Curl'] },
  { re: /^hammer curls?$/, ids: ['Hammer_Curls'] },
  { re: /^lateral raises?$|^side raises?$/, ids: ['Side_Lateral_Raise'] },
  { re: /^(squats?|air squats?|bodyweight squats?)$/, ids: ['Bodyweight_Squat'] },
  { re: /^(push[\s-]?ups?|pushups?)$/, ids: ['Pushups'] },
  { re: /^plank$/, ids: ['Plank'] },
];

const STOP = new Set(['the', 'a', 'an', 'with', 'and', 'of', 'to', 'on', 'for', 'rep', 'reps', 'set', 'sets', 'round']);
const SYN = { db: 'dumbbell', dumbell: 'dumbbell', bb: 'barbell', kb: 'kettlebell', calves: 'calf', abs: 'abdominal', ab: 'abdominal' };

function tokenize(s) {
  let t = String(s || '').toLowerCase().replace(/&/g, ' and ');
  t = t.replace(/\b(push|pull|sit|chin|step)[\s-]*ups?\b/g, '$1up');     // push-ups → pushup
  t = t.replace(/[^a-z0-9]+/g, ' ').trim();
  return t
    .split(' ')
    .filter(Boolean)
    .map((w) => SYN[w] || w)
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .filter((w) => !STOP.has(w) && !/^\d+$/.test(w));
}

const EQUIP_BONUS = { 'body only': 0.25, dumbbell: 0.2, '': -0.15, other: -0.1, machine: -0.2, cable: -0.15, barbell: -0.1 };

/**
 * @param {{muscles:string[], exercises:Array}} data  contents of exerciseIndex.json
 * @param {string} imgBase
 */
export function createMatcher(data, imgBase = DEFAULT_IMG_BASE) {
  const musclesList = data.muscles;
  const entries = data.exercises.map(([id, name, equipment, p, s]) => ({
    id,
    name,
    equipment,
    primary: p.map((i) => musclesList[i]),
    secondary: s.map((i) => musclesList[i]),
    tokens: tokenize(name),
    frames: [`${imgBase}/${id}/0.jpg`, `${imgBase}/${id}/1.jpg`],
  }));
  const byId = new Map(entries.map((e) => [e.id, e]));

  // inverted index: token → entries, so each lookup is cheap
  const inv = new Map();
  for (const e of entries) for (const t of new Set(e.tokens)) (inv.get(t) || inv.set(t, []).get(t)).push(e);

  function fuzzy(query) {
    const q = tokenize(query);
    if (q.length === 0) return null;
    const cand = new Map();
    for (const t of new Set(q)) for (const e of inv.get(t) || []) cand.set(e.id, e);
    let best = null;
    for (const e of cand.values()) {
      const eset = new Set(e.tokens);
      const hit = q.filter((t) => eset.has(t)).length;
      if (hit === 0) continue;
      const recall = hit / q.length;                       // how much of the query is covered
      const extra = e.tokens.length - hit;                  // extra words = more specific variation
      const score = recall * 3 - extra * 0.35 + (EQUIP_BONUS[e.equipment] ?? 0);
      if (!best || score > best.score) best = { e, score, recall };
    }
    // Need to cover most of what was asked for, otherwise better to show nothing than something wrong.
    return best && best.recall >= 0.6 && best.score >= 1.2 ? best.e : null;
  }

  function matchPart(part) {
    for (const o of OVERRIDES) {
      if (o.re.test(part)) {
        const found = o.ids.map((id) => byId.get(id)).filter(Boolean);
        if (found.length) return found;
      }
    }
    const hit = fuzzy(part);
    return hit ? [hit] : [];
  }

  /** Returns an array of 0..3 matches (several when the name is "X or Y" or a circuit of moves). */
  function findAll(name) {
    const lower = String(name || '').toLowerCase().trim();
    if (!lower) return [];
    // "Push-Ups or Diamond Push-Ups" → look up each alternative on its own
    const parts = lower.split(/\s+or\s+|\s*\/\s*/).map((x) => x.trim()).filter(Boolean);
    const found = (parts.length > 1 ? parts : [lower]).flatMap(matchPart);
    const seen = new Set();
    return found.filter((e) => !seen.has(e.id) && seen.add(e.id)).slice(0, 3);
  }

  return { findAll, find: (n) => findAll(n)[0] || null };
}
