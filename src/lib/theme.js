// Wallpaper helpers shared by the boot shell, the app layout, the public pages,
// and the Profile picker. Stored values stay "cosmic" (shown as Dark mode),
// "alabaster", or "gradient" so existing preferences keep working. There is no
// clock-driven mode.
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

/** The browser status bar follows the gradient's start color, not a blend. */
export function gradientChromeColor(colors) {
  return normalizeGradientColors(colors)[0]
}

/**
 * Foreground tokens for the in-app nav when it wears the gradient. The bottom
 * bar runs start→end upward and the desktop sidebar runs start→end rightward;
 * whichever text color contrasts with the start color keeps the icons legible.
 */
export function gradientNavColors(colors) {
  const start = gradientChromeColor(colors)
  const channels = [1, 3, 5].map((index) => parseInt(start.slice(index, index + 2), 16))
  const brightness = (0.299 * channels[0] + 0.587 * channels[1] + 0.114 * channels[2]) / 255
  return brightness > 0.6
    ? { primary: '0 0% 0%', muted: '0 0% 28%', tile: '0 0% 0%', mark: '0 0% 100%' }
    : { primary: '0 0% 100%', muted: '0 0% 72%', tile: '0 0% 100%', mark: '0 0% 0%' }
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
    // The boot shell uses the start color too, so there is no flash before React.
    root.style.setProperty('--boot-page', colors[0])
  } else {
    root.style.removeProperty('--wallpaper-from')
    root.style.removeProperty('--wallpaper-to')
    root.style.removeProperty('--boot-page')
  }

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const chromeColor = wallpaper === 'alabaster'
      ? '#ffffff'
      : wallpaper === 'gradient'
        ? gradientChromeColor(colors)
        : '#000000'
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
