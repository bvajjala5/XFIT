// Shared preview wallpaper for the public landing and demo pages. It is kept
// separate from the saved app wallpaper (xfit-theme): switching themes in the
// no-account demo should recolour the public pages without changing the
// preference the visitor will use once they sign in.

const STORAGE_KEY = 'xfit-public-wallpaper'
const DEFAULT = 'alabaster'

function normalize(value) {
  return value === 'cosmic' ? 'cosmic' : DEFAULT
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
  const wallpaper = normalize(next)
  if (wallpaper === current) return wallpaper
  current = wallpaper
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, wallpaper)
    }
  } catch {
    /* Storage can be unavailable; the in-memory value still applies. */
  }
  listeners.forEach((listener) => listener(wallpaper))
  return wallpaper
}

export function subscribePublicWallpaper(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
