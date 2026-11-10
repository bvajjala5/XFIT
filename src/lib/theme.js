// Theme helpers shared by the boot shell, the app layout, and the profile
// picker. The stored value is the user's *mode*: "midnight", "sunrise", or
// "auto" (stored as a missing key so older builds and the boot script agree).

export const THEME_KEY = 'xfit-theme'

export function autoTheme(date = new Date()) {
  const hour = date.getHours()
  return hour >= 6 && hour < 19 ? 'sunrise' : 'midnight'
}

export function getThemeMode() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'midnight' || saved === 'sunrise' || saved === 'auto') return saved
  } catch {
    /* localStorage can be unavailable in private modes. */
  }
  return 'auto'
}

export function resolveTheme(mode = getThemeMode()) {
  return mode === 'auto' ? autoTheme() : mode
}

let themeTransitionTimer

function beginThemeTransition(root) {
  root.classList.add('theme-transitioning')
  clearTimeout(themeTransitionTimer)
  themeTransitionTimer = setTimeout(() => {
    root.classList.remove('theme-transitioning')
  }, 1200)
}

export function applyResolvedTheme(resolved) {
  const root = document.documentElement
  // Only animate real changes; the first application (or a repeat every
  // minute while Auto has not crossed a boundary) should be instant.
  if (root.dataset.theme && root.dataset.theme !== resolved) beginThemeTransition(root)
  root.classList.remove('theme-midnight', 'theme-sunrise')
  root.classList.add(`theme-${resolved}`)
  root.dataset.theme = resolved
  root.dataset.themeMode = getThemeMode()
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'sunrise' ? '#fbf6ef' : '#20212d')
  return resolved
}

export function setThemeMode(mode) {
  try {
    if (mode === 'auto') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* Ignore storage failures; the current session still switches theme. */
  }
  return applyResolvedTheme(resolveTheme(mode))
}

/** @deprecated Use setThemeMode. Kept for older call sites. */
export function applyTheme(mode) {
  return setThemeMode(mode)
}
