// On-device corrections for third-party food entries. Nothing here syncs to an
// account or writes to Firestore; it simply makes a bad label usable on this phone.
const STORAGE_KEY = 'xfit_food_corrections_v1';
const NUMERIC_FIELDS = ['serving', 'calories', 'protein', 'carbs', 'fat'];
const TEXT_FIELDS = ['name', 'brand', 'servingLabel'];

function getStorage() {
  try { return globalThis.localStorage || null; }
  catch { return null; }
}

export function foodKey(food = {}) {
  const source = String(food.source || food.provider || 'unknown').toLowerCase();
  const rawId = food.id ?? food.code ?? food.barcode ?? food.sourceId ?? `${food.brand || ''}|${food.name || ''}`;
  return `${source}:${String(rawId).trim().toLowerCase()}`.replace(/\s+/g, '');
}

export function sanitizeCorrection(patch = {}) {
  const clean = {};
  for (const key of TEXT_FIELDS) {
    if (typeof patch[key] !== 'string') continue;
    const value = patch[key].trim().slice(0, 120);
    if (value) clean[key] = value;
  }
  for (const key of NUMERIC_FIELDS) {
    if (patch[key] === '' || patch[key] === null || patch[key] === undefined) continue;
    const value = Number(patch[key]);
    if (Number.isFinite(value) && value >= 0) clean[key] = Math.round(value * 100) / 100;
  }
  return clean;
}

export function loadFoodCorrections() {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
        .map(([key, value]) => [key, sanitizeCorrection(value)]),
    );
  } catch { return {}; }
}

function writeCorrections(corrections) {
  const storage = getStorage();
  if (!storage) return false;
  try { storage.setItem(STORAGE_KEY, JSON.stringify(corrections)); return true; }
  catch { return false; }
}

export function saveFoodCorrection(food, patch) {
  const key = foodKey(food);
  const clean = sanitizeCorrection(patch);
  if (!key || !Object.keys(clean).length) return loadFoodCorrections();
  const corrections = loadFoodCorrections();
  corrections[key] = { ...(corrections[key] || {}), ...clean };
  writeCorrections(corrections);
  return corrections;
}

export function removeFoodCorrection(food) {
  const corrections = loadFoodCorrections();
  delete corrections[foodKey(food)];
  writeCorrections(corrections);
  return corrections;
}

const SOURCE_LABELS = {
  usda: 'USDA',
  online: 'Open Food Facts',
  custom: 'Your food',
  meal: 'Your meal',
};

/** A short, human-readable source badge for food results and logged entries. */
export function foodSourceLabel(food = {}) {
  if (food.curated) return 'Uttar pick';
  return SOURCE_LABELS[food.source] || 'Uttar Fitness';
}

export function applyFoodCorrection(food, corrections = loadFoodCorrections()) {
  const key = foodKey(food);
  const patch = corrections[key];
  if (!patch || !food) return food;

  const per100 = { ...(food.per100 || {}) };
  for (const field of ['calories', 'protein', 'carbs', 'fat']) {
    if (patch[field] !== undefined) per100[field] = patch[field];
  }

  const corrected = {
    ...food,
    per100,
    corrected: true,
    correctionKey: key,
  };

  if (patch.serving !== undefined) {
    const label = patch.servingLabel || food.servings?.[0]?.[0] || '1 serving';
    corrected.servingGrams = patch.serving;
    corrected.servings = [
      [label, patch.serving],
      ...(food.servings || []).filter(([, grams]) => grams !== patch.serving),
    ];
  }
  if (patch.name !== undefined) {
    corrected.name = patch.name;
    corrected.label = patch.name;
  }
  if (patch.brand !== undefined) corrected.brand = patch.brand;

  return corrected;
}
