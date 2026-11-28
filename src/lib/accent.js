// Restrained accent presets. One primary colour is used for active states and
// CTAs; one muted support tone is used for secondary highlights. Wallpaper,
// body copy, cards and borders stay neutral in both presets.
// This module is imported by Node tests, so never touch the DOM at load time.

export const ACCENT_KEY = 'xfit-accent'
export const ACCENTS = ['neutral', 'blueprint']
export const DEFAULT_ACCENT = 'neutral'

export function migrateAccent(saved) {
  return saved === 'blueprint' ? 'blueprint' : DEFAULT_ACCENT
}

function readStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(ACCENT_KEY)
  } catch {
    /* localStorage can be unavailable in private modes. */
  }
  return null
}

function writeStorage(value) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(ACCENT_KEY, value)
  } catch {
    /* The current session can still use the selected preset. */
  }
}

export function getAccent() {
  const saved = readStorage()
  const accent = migrateAccent(saved)
  if (saved !== accent) writeStorage(accent)
  return accent
}

/** Apply the preset to the root element so CSS can swap only the colour tokens. */
export function applyAccent(accent = getAccent()) {
  const normalized = migrateAccent(accent)
  if (typeof document === 'undefined') return normalized
  document.documentElement.dataset.accent = normalized
  return normalized
}

/** Persist the choice and apply it immediately. */
export function setAccent(accent) {
  const normalized = migrateAccent(accent)
  writeStorage(normalized)
  return applyAccent(normalized)
}
