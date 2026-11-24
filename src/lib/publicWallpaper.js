// Shared preview wallpaper/mode for the public landing and demo pages. It is
// kept separate from the saved app wallpaper (xfit-theme): switching themes in
// the no-account demo should recolour the public pages without changing the
// preference the visitor will use once they sign in. "auto" resolves through
// the same clock helpers as the signed-in app and is not a saved account value.

const STORAGE_KEY = 'xfit-public-wallpaper'
const DEFAULT = 'alabaster'
const MODES = ['cosmic', 'alabaster', 'auto']

function normalize(value) {
  return MODES.includes(value) ? value : DEFAULT
}

function read() {
  try {
    if (typeof sessionStorage === 'undefined') return DEFAULT
    return normalize(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT
  }
}

let current = read()
const listeners = new Set()

export function getPublicWallpaper() {
  return current
}

export function setPublicWallpaper(next) {
  const mode = normalize(next)
  if (mode === current) return mode
  current = mode
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, mode)
    }
  } catch {
    /* Storage can be unavailable; the in-memory value still applies. */
  }
  listeners.forEach((listener) => listener(mode))
  return mode
}

export function subscribePublicWallpaper(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
