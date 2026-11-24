// Wallpaper helpers shared by the boot shell, the app layout, the public pages,
// and the Profile picker. Stored values are "cosmic" (Dark mode), "alabaster"
// (Light mode), or "auto" (resolve either static wallpaper from the local clock).
// Auto never loads artwork or animates on its own: it only picks one of the two
// existing static wallpapers and lets the CSS cross-fade do the transition.
// This module is also imported by Node tests, so never touch the DOM at load
// time and guard every browser API.

export const THEME_KEY = 'xfit-theme'

export const WALLPAPERS = ['cosmic', 'alabaster']
export const THEMES = [...WALLPAPERS, 'auto']
export const DEFAULT_WALLPAPER = 'cosmic'

// 7am → Light mode, 7pm → Dark mode. Local time, no timezone dependency.
const DAY_START_HOUR = 7
const NIGHT_START_HOUR = 19
const TRANSITION_MS = 420

/** Map any stored/legacy mode onto a supported mode. */
export function migrateThemeMode(saved) {
  if (saved === 'auto') return 'auto'
  if (saved === 'midnight') return 'cosmic'
  if (saved === 'sunrise') return 'alabaster'
  if (WALLPAPERS.includes(saved)) return saved
  return DEFAULT_WALLPAPER
}

function validDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date()
}

/** The static wallpaper Auto mode uses at a given moment. */
export function wallpaperForTime(date = new Date()) {
  const hour = validDate(date).getHours()
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'alabaster' : 'cosmic'
}

/** Milliseconds until the next 7am/7pm switch (floored to avoid tight loops). */
export function msUntilNextThemeChange(date = new Date()) {
  const now = validDate(date)
  const next = new Date(now.getTime())
  const hour = now.getHours()
  if (hour < DAY_START_HOUR) {
    next.setHours(DAY_START_HOUR, 0, 0, 0)
  } else if (hour < NIGHT_START_HOUR) {
    next.setHours(NIGHT_START_HOUR, 0, 0, 0)
  } else {
    next.setDate(next.getDate() + 1)
    next.setHours(DAY_START_HOUR, 0, 0, 0)
  }
  return Math.max(60_000, next.getTime() - now.getTime())
}

function readStorage(key) {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch {
    /* localStorage can be unavailable in private modes. */
  }
  return null
}

function writeStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  } catch {
    /* Ignore storage failures; the current session can still switch. */
  }
}

export function getThemeMode() {
  const saved = readStorage(THEME_KEY)
  const mode = migrateThemeMode(saved)
  // Persist the migrated value so legacy builds and the boot script agree.
  if (saved !== mode) writeStorage(THEME_KEY, mode)
  return mode
}

/** Resolve a mode to a static wallpaper. Auto uses the local clock. */
export function resolveTheme(mode = getThemeMode(), date = new Date()) {
  const normalized = migrateThemeMode(mode)
  return normalized === 'auto' ? wallpaperForTime(date) : normalized
}

let transitionTimer

function requestTransition(root) {
  if (typeof window === 'undefined') return
  root.classList.add('theme-transition')
  window.clearTimeout(transitionTimer)
  transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), TRANSITION_MS + 80)
}

export function applyResolvedTheme(resolved, date = new Date()) {
  const wallpaper = resolveTheme(resolved, date)
  if (typeof document === 'undefined') return wallpaper

  const root = document.documentElement
  const changed = root.dataset.theme !== wallpaper
  // Drop legacy classes too, so an old DOM cannot keep two token sets at once.
  root.classList.remove('theme-cosmic', 'theme-alabaster', 'theme-gradient', 'theme-midnight', 'theme-sunrise')
  root.classList.add(`theme-${wallpaper}`)
  root.dataset.theme = wallpaper
  root.dataset.themeMode = getThemeMode()

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', wallpaper === 'alabaster' ? '#ffffff' : '#000000')
  }
  if (changed) requestTransition(root)
  return wallpaper
}

/** Persist the chosen mode (including auto) and apply it immediately. */
export function setThemeMode(mode, date = new Date()) {
  const normalized = migrateThemeMode(mode)
  writeStorage(THEME_KEY, normalized)
  return applyResolvedTheme(normalized, date)
}
