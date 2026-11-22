// Goals tracker: pure logic + persistence for the Home screen goals popup.
// No top-level browser-API or firebase imports so `node --test` can load this
// module directly; firestore is imported dynamically inside loadGoals/saveGoals.

export const STORAGE_KEY = 'xfit_goals_tracker_v1'
export const GOALS_CHANGED = 'xfit-goals-changed'

// Known auto-evaluable goal patterns. Text is matched case-insensitively.
// Each rule maps to a field on the context object produced by computeContext.
export const localDateStr = (d = new Date()) => new Intl.DateTimeFormat('en-CA').format(d)

export const RULE_HINTS = {
  workout: {
    patterns: ['workout', 'exercise', 'train', 'session', 'sessions'],
    hint: 'Auto: marked done when you complete a workout',
  },
  checkin: {
    patterns: ['check-in', 'check in', 'checkin'],
    hint: 'Auto: marked done when you complete a daily check-in',
  },
  streak: {
    patterns: ['streak'],
    hint: 'Auto: marked done when your streak reaches the number in the text',
  },
  minutes: {
    patterns: ['minute', 'minutes', 'min', 'mins'],
    hint: 'Auto: marked done when weekly minutes reach the number in the text',
  },
  calories: {
    patterns: ['calorie', 'calories', 'cal', 'cals', 'kcal'],
    hint: 'Auto: marked done when weekly calories reach the number in the text',
  },
}

const hasWord = (text, word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(text)

// Returns a rule name ('workout' | 'checkin' | 'streak' | 'minutes' | 'calories')
// if the goal text matches a known auto-evaluable pattern, otherwise null.
export function inferRule(text) {
  if (typeof text !== 'string' || !text.trim()) return null
  const t = text.toLowerCase()
  for (const [rule, { patterns }] of Object.entries(RULE_HINTS)) {
    for (const p of patterns) {
      if (hasWord(t, p)) return rule
    }
  }
  return null
}

// Extract the first integer from the goal text (used as a numeric target).
function targetNumber(text, fallback = 1) {
  const m = /(\d+)/.exec(text || '')
  if (!m) return fallback
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// Returns true if the goal should currently count as done.
// Auto rules ignore item.done entirely; manual items use !!item.done.
export function evaluateGoal(item, ctx) {
  if (!item) return false
  const rule = inferRule(item.text)
  if (!rule) return !!item.done
  switch (rule) {
    case 'workout':
      return (ctx.weekWorkouts || 0) >= targetNumber(item.text, 1)
    case 'checkin':
      return !!ctx.todayLogged
    case 'streak':
      return (ctx.streak || 0) >= targetNumber(item.text, 1)
    case 'minutes':
      return (ctx.weekMinutes || 0) >= targetNumber(item.text, 150)
    case 'calories':
      return (ctx.weekCalories || 0) >= targetNumber(item.text, 500)
    default:
      return !!item.done
  }
}

// Derive the data context (today, streak, weekly totals) from workout logs.
// Deterministic when `now` is passed. Logs may carry Firestore Timestamps
// (completedAt?.toDate?.()) — same handling as Home.jsx.
export function computeContext(logs = [], now = new Date()) {
  const list = Array.isArray(logs) ? logs : []
  const time = (log) => {
    const raw = log?.completedAt?.toDate?.() || log?.completedAt || log?.createdAt || 0
    return new Date(raw).getTime() || 0
  }
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const weekLogs = list.filter((l) => time(l) >= weekAgo.getTime() && time(l) <= now.getTime())
  const todayStr = localDateStr(now)
  const todayLogged = list.some((l) => localDateStr(new Date(time(l))) === todayStr)

  // Deterministic streak (same walk-back logic as utils.calcStreak, but
  // anchored at `now` instead of Date.now()).
  const dates = [...new Set(list.map((l) => localDateStr(new Date(time(l)))))].sort().reverse()
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const check = localDateStr(new Date(now.getTime() - i * 86400000))
    if (dates.includes(check)) streak++
    else if (i > 0) break
  }

  return {
    todayStr,
    todayLogged,
    streak,
    weekWorkouts: weekLogs.length,
    weekMinutes: Math.round(weekLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60),
    weekCalories: weekLogs.reduce((s, l) => s + (l.calories_burned || 0), 0),
  }
}

// Progress over the whole list: level drives the button color,
// fraction drives the ring/percentage.
export function computeProgress(items = [], ctx = {}) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []
  if (!list.length) return { total: 0, done: 0, fraction: 0, level: 'empty' }
  const done = list.filter((item) => evaluateGoal(item, ctx)).length
  const fraction = done / list.length
  let level
  if (done === 0) level = 'red'
  else if (done === list.length) level = 'green'
  else level = 'orange'
  return { total: list.length, done, fraction, level }
}

// ---- persistence -----------------------------------------------------------

export function loadLocal() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocal(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []))
  } catch {
    /* no-op in Node or when storage is blocked */
  }
}

export function broadcast() {
  try {
    window.dispatchEvent(new CustomEvent(GOALS_CHANGED))
  } catch {
    /* no-op outside a browser */
  }
}

// ---- firestore-backed persistence (dynamic imports only) -------------------

export async function loadGoals(uid) {
  if (!uid) return loadLocal()
  try {
    const [{ doc, getDoc }, { db }] = await Promise.all([
      import('firebase/firestore/lite'),
      import('./firestore'),
    ])
    const snap = await getDoc(doc(db, 'users', uid, 'goals', 'checklist'))
    if (!snap.exists()) return loadLocal()
    const data = snap.data()
    const goals = Array.isArray(data?.items) ? data.items : []
    saveLocal(goals)
    return goals
  } catch {
    return loadLocal()
  }
}

export async function saveGoals(uid, items) {
  const list = Array.isArray(items) ? items : []
  saveLocal(list)
  broadcast()
  if (!uid) return
  try {
    const [{ doc, setDoc }, { db }] = await Promise.all([
      import('firebase/firestore/lite'),
      import('./firestore'),
    ])
    await setDoc(doc(db, 'users', uid, 'goals', 'checklist'), { items: list, updatedAt: Date.now() }, { merge: true })
  } catch {
    /* local copy already saved; sync can retry later */
  }
}

// ---- list mutations (each returns a fresh array and callers persist it) ----

export function addItem(items, text) {
  const clean = (text || '').trim()
  if (!clean) return Array.isArray(items) ? [...items] : []
  const list = Array.isArray(items) ? items : []
  return [...list, { id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, text: clean, done: false, createdAt: Date.now() }]
}

export function removeItem(items, id) {
  return (Array.isArray(items) ? items : []).filter((i) => i?.id !== id)
}

export function toggleDone(items, id) {
  return (Array.isArray(items) ? items : []).map((i) =>
    i?.id === id ? { ...i, done: !i.done } : i
  )
}
