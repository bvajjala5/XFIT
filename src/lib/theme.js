// Wallpaper helpers shared by the boot shell, the app layout, the public pages,
// and the Profile picker. Stored values stay "cosmic" (shown as Dark mode) or
// "alabaster" (shown as Light mode). There is no clock-driven mode.
// This module is also imported by Node tests, so never touch the DOM at load
// time and guard every browser API.

export const THEME_KEY = 'xfit-theme'

export const WALLPAPERS = ['cosmic', 'alabaster']
export const DEFAULT_WALLPAPER = 'cosmic'

/** Map any stored/legacy mode onto one of the two static wallpapers. */
export function migrateThemeMode(saved) {
  if (saved === 'midnight') return 'cosmic'
  if (saved === 'sunrise' || saved === 'auto') return 'alabaster'
  if (WALLPAPERS.includes(saved)) return saved
  return DEFAULT_WALLPAPER
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

/** Identity for valid wallpapers; legacy names are normalized. No clock. */
export function resolveTheme(mode = getThemeMode()) {
  return migrateThemeMode(mode)
}

export function applyResolvedTheme(resolved) {
  const wallpaper = migrateThemeMode(resolved)
  if (typeof document === 'undefined') return wallpaper

  const root = document.documentElement
  // Drop legacy classes too, so an old DOM cannot keep two token sets at once.
  root.classList.remove('theme-cosmic', 'theme-alabaster', 'theme-gradient', 'theme-midnight', 'theme-sunrise')
  root.classList.add(`theme-${wallpaper}`)
  root.dataset.theme = wallpaper
  root.dataset.themeMode = getThemeMode()

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', wallpaper === 'alabaster' ? '#ffffff' : '#000000')
  }
  return wallpaper
}

/** Persist the wallpaper and apply it immediately. */
export function setThemeMode(mode) {
  const wallpaper = migrateThemeMode(mode)
  writeStorage(THEME_KEY, wallpaper)
  return applyResolvedTheme(wallpaper)
}
