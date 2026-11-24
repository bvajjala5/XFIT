import test from 'node:test'
import assert from 'node:assert/strict'
import {
  STORAGE_KEY,
  GOALS_CHANGED,
  RULE_HINTS,
  RULE_PRIORITY,
  inferRule,
  evaluateGoal,
  autoSatisfied,
  computeContext,
  computeProgress,
  loadLocal,
  saveLocal,
  addItem,
  removeItem,
  toggleDone,
} from './goalsTracker.js'
import { localDateStr } from './goalsTracker.js'

// ---- inferRule -------------------------------------------------------------

test('inferRule maps all auto patterns', () => {
  assert.equal(inferRule('Do 4 workouts this week'), 'workout')
  assert.equal(inferRule('exercise every day'), 'workout')
  assert.equal(inferRule('train 3 times'), 'workout')
  assert.equal(inferRule('complete daily check-in'), 'checkin')
  assert.equal(inferRule('Check In today'), 'checkin')
  assert.equal(inferRule('checkin streak alive'), 'streak') // specific rule wins
  assert.equal(inferRule('keep a 7 day streak'), 'streak')
  assert.equal(inferRule('150 minutes per week'), 'minutes')
  assert.equal(inferRule('20 mins of stretching'), 'minutes')
  assert.equal(inferRule('burn 2000 calories'), 'calories')
  assert.equal(inferRule('eat 500 kcal'), 'calories')
})

test('numeric rules beat the generic workout catch-all', () => {
  assert.equal(inferRule('30 min workout'), 'minutes')
  assert.equal(inferRule('workout for 45 minutes'), 'minutes')
  assert.equal(inferRule('burn 500 calories during workout'), 'calories')
  assert.equal(inferRule('3 workouts this week'), 'workout')
  assert.deepEqual(RULE_PRIORITY, ['streak', 'minutes', 'calories', 'checkin', 'workout'])
})

test('inferRule is case-insensitive', () => {
  assert.equal(inferRule('WORKOUT HARD'), 'workout')
  assert.equal(inferRule('Streak'), 'streak')
  assert.equal(inferRule('CALORIES!!'), 'calories')
})

test('inferRule returns null for non-matching text', () => {
  assert.equal(inferRule('drink water'), null)
  assert.equal(inferRule('meditate'), null)
  assert.equal(inferRule(''), null)
  assert.equal(inferRule('   '), null)
  assert.equal(inferRule(null), null)
  assert.equal(inferRule(undefined), null)
  assert.equal(inferRule(42), null)
})

test('rule hints exist for every rule', () => {
  for (const rule of ['workout', 'checkin', 'streak', 'minutes', 'calories']) {
    assert.ok(RULE_HINTS[rule]?.hint, `hint for ${rule}`)
    assert.ok(RULE_HINTS[rule].patterns.length > 0)
  }
})

// ---- evaluateGoal ----------------------------------------------------------

const emptyCtx = {
  todayStr: localDateStr(new Date(2026, 10, 21)),
  todayLogged: false,
  streak: 0,
  weekWorkouts: 0,
  weekMinutes: 0,
  weekCalories: 0,
}
const richCtx = {
  todayStr: localDateStr(new Date(2026, 10, 21)),
  todayLogged: true,
  streak: 5,
  weekWorkouts: 4,
  weekMinutes: 160,
  weekCalories: 2200,
}

test('evaluateGoal: workout rule', () => {
  const one = { id: '1', text: 'finish a workout' }
  assert.equal(evaluateGoal(one, emptyCtx), false)
  assert.equal(evaluateGoal(one, richCtx), true)
  const four = { id: '2', text: '4 workouts this week' }
  assert.equal(evaluateGoal(four, { ...emptyCtx, weekWorkouts: 3 }), false)
  assert.equal(evaluateGoal(four, { ...emptyCtx, weekWorkouts: 4 }), true)
})

test('evaluateGoal: checkin rule', () => {
  const item = { id: '3', text: 'daily check-in' }
  assert.equal(evaluateGoal(item, { ...emptyCtx, todayLogged: false }), false)
  assert.equal(evaluateGoal(item, { ...emptyCtx, todayLogged: true }), true)
})

test('evaluateGoal: streak rule', () => {
  const item = { id: '4', text: 'keep a 7 day streak' }
  assert.equal(evaluateGoal(item, { ...emptyCtx, streak: 6 }), false)
  assert.equal(evaluateGoal(item, { ...emptyCtx, streak: 7 }), true)
})

test('evaluateGoal: minutes rule', () => {
  const item = { id: '5', text: '150 minutes this week' }
  assert.equal(evaluateGoal(item, { ...emptyCtx, weekMinutes: 149 }), false)
  assert.equal(evaluateGoal(item, { ...emptyCtx, weekMinutes: 150 }), true)
})

test('evaluateGoal: calories rule', () => {
  const item = { id: '6', text: 'burn 2000 calories' }
  assert.equal(evaluateGoal(item, { ...emptyCtx, weekCalories: 1999 }), false)
  assert.equal(evaluateGoal(item, { ...emptyCtx, weekCalories: 2000 }), true)
})

test('evaluateGoal: auto rules count manual check OR matching activity', () => {
  // Auto goals complete from activity, but a manual tap must also stick.
  assert.equal(evaluateGoal({ id: '7', text: 'finish a workout', done: true }, emptyCtx), true)
  assert.equal(evaluateGoal({ id: '7b', text: 'finish a workout', done: false }, emptyCtx), false)
  assert.equal(evaluateGoal({ id: '8', text: 'workout this week', done: false }, richCtx), true)
  // Unchecking a manual check still works when the activity hasn't happened.
  const checked = { id: '9', text: 'daily check-in', done: true }
  assert.equal(evaluateGoal(checked, { ...emptyCtx, todayLogged: false }), true)
  assert.equal(evaluateGoal({ ...checked, done: false }, { ...emptyCtx, todayLogged: false }), false)
})

test('evaluateGoal: manual items use !!item.done', () => {
  const manual = { id: '9', text: 'drink water', done: false }
  assert.equal(evaluateGoal(manual, richCtx), false)
  assert.equal(evaluateGoal({ ...manual, done: true }, richCtx), true)
  assert.equal(evaluateGoal(null, richCtx), false)
  // empty text has no rule -> manual -> done is undefined -> false
  assert.equal(evaluateGoal({ id: '10', text: '' }, richCtx), false)
})

test('autoSatisfied ignores manual checks', () => {
  const item = { id: 'a', text: 'finish a workout', done: true }
  assert.equal(autoSatisfied(item, { ...emptyCtx, weekWorkouts: 0 }), false)
  assert.equal(autoSatisfied(item, { ...emptyCtx, weekWorkouts: 1 }), true)
  assert.equal(autoSatisfied({ text: 'drink water', done: true }, richCtx), false)
})

test('manual checks reset on a new day', () => {
  const checked = toggleDone([{ id: 'a', text: 'drink water', done: false }], 'a', '2026-11-20')[0]
  assert.equal(checked.done, true)
  assert.equal(checked.doneOn, '2026-11-20')
  const ctx = { ...emptyCtx, todayStr: '2026-11-20' }
  assert.equal(evaluateGoal(checked, ctx), true)
  assert.equal(evaluateGoal(checked, { ...ctx, todayStr: '2026-11-21' }), false)
  // Ticking it again on the new day stores the new date.
  const rechecked = toggleDone([checked], 'a', '2026-11-21')[0]
  assert.equal(rechecked.doneOn, '2026-11-21')
  assert.equal(evaluateGoal(rechecked, { ...ctx, todayStr: '2026-11-21' }), true)
  // Unticking clears the date.
  assert.equal(toggleDone([rechecked], 'a', '2026-11-21')[0].doneOn, null)
})

test('legacy manual checks without doneOn keep working', () => {
  const legacy = { id: 'a', text: 'drink water', done: true }
  assert.equal(evaluateGoal(legacy, { ...emptyCtx, todayStr: '2026-11-21' }), true)
})

// ---- computeContext --------------------------------------------------------

const now = new Date(2026, 10, 21, 9, 0, 0) // Sat Nov 21 2026 local
const logAt = (offsetDays, extra = {}) => ({
  id: `log${offsetDays}`,
  completedAt: new Date(now.getTime() - offsetDays * 86400000),
  duration_seconds: 1800,
  calories_burned: 300,
  ...extra,
})

test('computeContext week-window math with fixed now', () => {
  const logs = [logAt(0), logAt(3), logAt(10)]
  const ctx = computeContext(logs, now)
  assert.equal(ctx.todayStr, localDateStr(now))
  assert.equal(ctx.weekWorkouts, 2) // today + 3 days ago; 10 days ago is out
  assert.equal(ctx.weekMinutes, 60)
  assert.equal(ctx.weekCalories, 600)
  assert.equal(ctx.todayLogged, true)
  // streak walk-back stops at the first missing day: only today connects
  assert.equal(ctx.streak, 1)
})

test('computeContext counts a log exactly 7 days back as in-week', () => {
  const ctx = computeContext([logAt(7)], now)
  assert.equal(ctx.weekWorkouts, 1)
})

test('computeContext streak from consecutive days', () => {
  const logs = [logAt(0), logAt(1), logAt(2), logAt(4)]
  assert.equal(computeContext(logs, now).streak, 3) // 4-day gap breaks it
})

test('computeContext with no logs', () => {
  const ctx = computeContext([], now)
  assert.equal(ctx.todayLogged, false)
  assert.equal(ctx.streak, 0)
  assert.equal(ctx.weekWorkouts, 0)
})

test('computeContext ignores non-numeric duration/calories', () => {
  const ctx = computeContext([{ id: 'x', completedAt: now, duration_seconds: null, calories_burned: undefined }], now)
  assert.equal(ctx.weekMinutes, 0)
  assert.equal(ctx.weekCalories, 0)
})

test('computeContext handles Firestore Timestamp shape', () => {
  const log = { id: 'ts', completedAt: { toDate: () => now }, duration_seconds: 3600, calories_burned: 500 }
  const ctx = computeContext([log], now)
  assert.equal(ctx.todayLogged, true)
  assert.equal(ctx.weekMinutes, 60)
  assert.equal(ctx.weekCalories, 500)
})

// ---- computeProgress -------------------------------------------------------

test('computeProgress: empty level with no goals', () => {
  assert.deepEqual(computeProgress([], emptyCtx), { total: 0, done: 0, fraction: 0, level: 'empty' })
})

test('computeProgress: red when 0% done', () => {
  const items = [{ id: 'a', text: 'drink water' }, { id: 'b', text: 'meditate' }]
  const p = computeProgress(items, emptyCtx)
  assert.equal(p.level, 'red')
  assert.equal(p.done, 0)
  assert.equal(p.fraction, 0)
})

test('computeProgress: orange when some done', () => {
  const items = [{ id: 'a', text: 'finish a workout' }, { id: 'b', text: 'drink water' }]
  const p = computeProgress(items, richCtx)
  assert.equal(p.level, 'orange')
  assert.equal(p.done, 1)
  assert.equal(p.fraction, 0.5)
})

test('computeProgress: green when all done', () => {
  const items = [{ id: 'a', text: 'finish a workout' }, { id: 'b', text: 'daily check-in' }]
  const p = computeProgress(items, richCtx)
  assert.equal(p.level, 'green')
  assert.equal(p.done, 2)
  assert.equal(p.fraction, 1)
})

test('computeProgress fraction math', () => {
  const items = [
    { id: 'a', text: 'drink water', done: true },
    { id: 'b', text: 'meditate', done: false },
    { id: 'c', text: 'stretch', done: false },
    { id: 'd', text: 'read', done: false },
  ]
  const p = computeProgress(items, emptyCtx)
  assert.equal(p.total, 4)
  assert.equal(p.done, 1)
  assert.equal(p.fraction, 0.25)
  assert.equal(p.level, 'orange')
})

// ---- mutations -------------------------------------------------------------

test('addItem appends a normalized goal', () => {
  const items = addItem([], 'Drink water')
  assert.equal(items.length, 1)
  assert.equal(items[0].text, 'Drink water')
  assert.equal(items[0].done, false)
  assert.ok(items[0].id)
  assert.ok(typeof items[0].createdAt === 'number')
  assert.equal(addItem(items, '  ').length, 1) // blank text is a no-op
  assert.equal(addItem(null, 'x').length, 1)
})

test('removeItem drops only the matching id', () => {
  let items = addItem([], 'A')
  items = addItem(items, 'B')
  const after = removeItem(items, items[0].id)
  assert.equal(after.length, 1)
  assert.equal(after[0].text, 'B')
  assert.equal(items.length, 2) // original untouched
  assert.equal(removeItem(after, 'nope').length, 1)
})

test('toggleDone flips only the matching goal', () => {
  let items = addItem([], 'A')
  items = addItem(items, 'B')
  const flipped = toggleDone(items, items[0].id)
  assert.equal(flipped[0].done, true)
  assert.equal(flipped[1].done, false)
  assert.equal(items[0].done, false) // original untouched
  assert.equal(toggleDone(flipped, items[0].id)[0].done, false) // flip back
})

// ---- constants -------------------------------------------------------------

test('exposed constants', () => {
  assert.equal(STORAGE_KEY, 'xfit_goals_tracker_v1')
  assert.equal(GOALS_CHANGED, 'xfit-goals-changed')
})

// ---- loadLocal / saveLocal (pure behavior; storage guarded in Node) --------

test('loadLocal returns an array when storage is unavailable', () => {
  const out = loadLocal()
  assert.ok(Array.isArray(out))
})

test('saveLocal does not throw when storage is unavailable', () => {
  assert.doesNotThrow(() => saveLocal([{ id: 'x', text: 'hi', done: false }]))
})

test('loadLocal/saveLocal round-trip when a storage stub is present', () => {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  }
  try {
    assert.deepEqual(loadLocal(), [])
    const items = [{ id: 'g1', text: 'drink water', done: true }]
    saveLocal(items)
    assert.deepEqual(loadLocal(), items)
    assert.equal(store.get(STORAGE_KEY), JSON.stringify(items))
    // non-array payloads fall back to []
    store.set(STORAGE_KEY, '{"a":1}')
    assert.deepEqual(loadLocal(), [])
    store.set(STORAGE_KEY, 'not json')
    assert.deepEqual(loadLocal(), [])
  } finally {
    delete globalThis.window
  }
})
