// A tiny local hint that a Firebase session existed on this device. Firebase
// already persists the real auth token; this flag only lets the public home
// route show a short loader while Firebase restores the session instead of
// flashing the marketing page to a signed-in visitor.
export const SESSION_HINT_KEY = 'xfit-has-session'

export function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function markSessionHint() {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
  } catch {
    /* Storage can be unavailable in private modes; auth still works. */
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    /* Ignore storage failures. */
  }
}
