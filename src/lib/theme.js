// Wallpaper helpers shared by the boot shell, the app layout, the public pages,
// and the Profile picker. The stored value is the user's wallpaper: "cosmic",
// "alabaster", or "gradient". It is static — there is no clock-driven mode.
// This module is also imported by Node tests, so never touch the DOM at load
// time and guard every browser API.

export const THEME_KEY = 'xfit-theme'
export const GRADIENT_KEY = 'xfit-gradient-colors'

export const WALLPAPERS = ['cosmic', 'alabaster', 'gradient']
export const DEFAULT_WALLPAPER = 'cosmic'
export const DEFAULT_GRADIENT_COLORS = ['#1e1b4b', '#0ea5e9']

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** Map any stored/legacy mode onto one of the three static wallpapers. */
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

function expandHex(color) {
  const digits = color.toLowerCase().slice(1)
  return digits.length === 3 ? digits.split('').map((digit) => digit + digit).join('') : digits
}

/** Accept exactly two #rgb or #rrggbb colors; otherwise fall back sensibly. */
export function normalizeGradientColors(colors) {
  if (!Array.isArray(colors) || colors.length !== 2) return [...DEFAULT_GRADIENT_COLORS]
  if (!colors.every((color) => typeof color === 'string' && HEX_COLOR.test(color))) {
    return [...DEFAULT_GRADIENT_COLORS]
  }
  return colors.map(expandHex).map((digits) => `#${digits}`)
}

export function getGradientColors() {
  let stored = null
  try {
    stored = JSON.parse(readStorage(GRADIENT_KEY))
  } catch {
    /* Malformed JSON falls back to the defaults. */
  }
  return normalizeGradientColors(stored)
}

/** Accept either an array of two colors or two positional color arguments. */
export function setGradientColors(colors, second) {
  const pair = Array.isArray(colors) ? colors : [colors, second]
  const normalized = normalizeGradientColors(pair)
  writeStorage(GRADIENT_KEY, JSON.stringify(normalized))
  return normalized
}

/** A static theme-color for the browser chrome: midpoint of the two colors. */
export function gradientMidpoint(colors) {
  const [from, to] = normalizeGradientColors(colors)
  const channels = [0, 2, 4].map((index) => {
    const a = parseInt(from.slice(1 + index, 3 + index), 16)
    const b = parseInt(to.slice(1 + index, 3 + index), 16)
    return Math.round((a + b) / 2).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

export function applyResolvedTheme(resolved) {
  const wallpaper = migrateThemeMode(resolved)
  if (typeof document === 'undefined') return wallpaper

  const root = document.documentElement
  // Drop legacy classes too, so an old DOM cannot keep both token sets.
  root.classList.remove('theme-cosmic', 'theme-alabaster', 'theme-gradient', 'theme-midnight', 'theme-sunrise')
  root.classList.add(`theme-${wallpaper}`)
  root.dataset.theme = wallpaper
  root.dataset.themeMode = getThemeMode()

  const colors = getGradientColors()
  if (wallpaper === 'gradient') {
    root.style.setProperty('--wallpaper-from', colors[0])
    root.style.setProperty('--wallpaper-to', colors[1])
  } else {
    root.style.removeProperty('--wallpaper-from')
    root.style.removeProperty('--wallpaper-to')
  }

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const chromeColor = wallpaper === 'alabaster'
      ? '#fbf6ef'
      : wallpaper === 'gradient'
        ? gradientMidpoint(colors)
        : '#1a1c23'
    meta.setAttribute('content', chromeColor)
  }
  return wallpaper
}

/** `setThemeMode('gradient', ['#123456', '#abcdef'])` saves both at once. */
export function setThemeMode(mode, optionalColors) {
  const wallpaper = migrateThemeMode(mode)
  if (optionalColors !== undefined) setGradientColors(optionalColors)
  writeStorage(THEME_KEY, wallpaper)
  return applyResolvedTheme(wallpaper)
}
