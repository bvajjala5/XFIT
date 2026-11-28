// Pure state helpers for the hybrid (reps + time) workout player.
// No browser APIs at module scope so `node --test` can load it directly.

export const MODE_REPS = 'reps'
export const MODE_TIME = 'time'

export const DEFAULT_REPS = 10
export const DEFAULT_SECONDS = 30
export const DEFAULT_REST_SECONDS = 30
// Break between different exercises. Rest between sets of the same exercise
// stays at that exercise's own restSeconds; this gap is only for transitioning.
export const DEFAULT_TRANSITION_SECONDS = 15
export const SESSION_KEY = 'xfit_active_session_v1'

const HOLD_NAME = /plank|hold|stretch|breath|savasana|pose|wall\s?sit|bridge|bird\s?dog|dead\s?bug/i

const clampInt = (value, fallback, min, max) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function normalizeMode(value) {
  return value === MODE_REPS || value === MODE_TIME ? value : null
}

/** Clamp a caller-supplied transition break, defaulting to the 15s gap. */
export function transitionSeconds(value = DEFAULT_TRANSITION_SECONDS) {
  return clampInt(value, DEFAULT_TRANSITION_SECONDS, 0, 600)
}

/**
 * Pick a sensible starting mode for an exercise. An explicit `mode` always
 * wins. Built-in workouts carry both reps and duration for timed intervals;
 * those are time-based. Strength sets (sets + reps) are rep-based.
 */
export function detectMode(ex) {
  const explicit = normalizeMode(ex?.mode)
  if (explicit) return explicit
  if (HOLD_NAME.test(String(ex?.name || ''))) return MODE_TIME
  const reps = Number(ex?.reps) || 0
  const duration = Number(ex?.duration ?? ex?.duration_seconds) || 0
  if (ex?.sets && reps) return MODE_REPS
  if (duration && !ex?.sets) return MODE_TIME
  return reps ? MODE_REPS : MODE_TIME
}

export function targetFor(ex, mode) {
  if (mode === MODE_TIME) {
    return clampInt(ex?.duration ?? ex?.duration_seconds, DEFAULT_SECONDS, 1, 3600)
  }
  return clampInt(ex?.reps, DEFAULT_REPS, 1, 999)
}

export function signatureFor(exercises) {
  return (Array.isArray(exercises) ? exercises : [])
    .map((ex) => {
      const mode = detectMode(ex)
      return [
        String(ex?.name || '').toLowerCase().trim(),
        mode,
        targetFor(ex, mode),
        clampInt(ex?.sets, 1, 1, 20),
        clampInt(ex?.rest_seconds, DEFAULT_REST_SECONDS, 0, 600),
      ].join(':')
    })
    .join('::')
}

/** Build a fresh session. `sets` holds one record per completed set, or null. */
export function createSession(exercises) {
  const list = Array.isArray(exercises) ? exercises : []
  return {
    signature: signatureFor(list),
    savedAt: null,
    exercises: list.map((raw, index) => {
      const mode = detectMode(raw)
      const setCount = clampInt(raw?.sets, 1, 1, 20)
      return {
        index,
        name: String(raw?.name || `Exercise ${index + 1}`),
        mode,
        setCount,
        target: targetFor(raw, mode),
        repsTarget: clampInt(raw?.reps, DEFAULT_REPS, 1, 999),
        secondsTarget: clampInt(raw?.duration ?? raw?.duration_seconds, DEFAULT_SECONDS, 1, 3600),
        weight: raw?.weight ? String(raw.weight) : '',
        restSeconds: clampInt(raw?.rest_seconds, DEFAULT_REST_SECONDS, 0, 600),
        intervalSeconds: clampInt(raw?.interval_seconds, 0, 0, 60),
        holdSeconds: clampInt(raw?.hold_seconds, 0, 0, 600),
        sets: Array.from({ length: setCount }, () => null),
      }
    }),
  }
}

export function setExerciseMode(session, exIndex, mode) {
  const nextMode = normalizeMode(mode)
  if (!nextMode || !session?.exercises?.[exIndex]) return session
  return {
    ...session,
    exercises: session.exercises.map((ex, i) => {
      if (i !== exIndex || ex.mode === nextMode) return ex
      const raw = { reps: ex.repsTarget, duration: ex.secondsTarget }
      return {
        ...ex,
        mode: nextMode,
        target: targetFor(raw, nextMode),
        // Completed sets keep the metric they were actually performed with.
      }
    }),
  }
}

export function adjust(value, delta, min = 0, max = 9999) {
  const n = Number(value)
  const base = Number.isFinite(n) ? n : min
  return Math.min(max, Math.max(min, Math.round(base + Number(delta || 0))))
}

/** Accept "12", "12 reps", "60s", "1:30" and "1 min 30 sec" from quick inputs. */
export function parseQuantity(raw, fallback = 0) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : fallback
  const text = String(raw ?? '').trim().toLowerCase()
  if (!text) return fallback

  const clock = text.match(/^(\d+):([0-5]?\d)$/)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])

  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)s?/)
  const seconds = text.match(/(\d+(?:\.\d+)?)\s*(?:sec|second)s?/)
  if (minutes || seconds) {
    return Math.round((Number(minutes?.[1]) || 0) * 60 + (Number(seconds?.[1]) || 0))
  }

  const number = text.match(/-?\d+(?:\.\d+)?/)
  return number ? Math.max(0, Math.round(Number(number[0]))) : fallback
}

export function recordSet(session, exIndex, setIndex, record) {
  if (!session?.exercises?.[exIndex] || setIndex < 0) return session
  return {
    ...session,
    exercises: session.exercises.map((ex, i) => {
      if (i !== exIndex || setIndex >= ex.sets.length) return ex
      const sets = ex.sets.slice()
      sets[setIndex] = {
        set: setIndex + 1,
        mode: ex.mode,
        target: ex.target,
        actual: adjust(record?.actual, 0, 0, 36000),
        seconds: adjust(record?.seconds, 0, 0, 36000),
        weight: String(record?.weight ?? ex.weight ?? ''),
        source: record?.source === 'camera' ? 'camera' : 'manual',
        completedAt: record?.completedAt || new Date().toISOString(),
      }
      return { ...ex, sets }
    }),
  }
}

/** First set that still needs doing; `done` means every set is recorded. */
export function firstIncomplete(session) {
  const list = session?.exercises || []
  for (let exIndex = 0; exIndex < list.length; exIndex += 1) {
    const sets = list[exIndex]?.sets || []
    const setIndex = sets.findIndex((record) => !record)
    if (setIndex >= 0) return { exIndex, setIndex, done: false }
  }
  return { exIndex: 0, setIndex: 0, done: true }
}

/** Update the rest length for one exercise; used by the in-player rest controls. */
export function setRestSeconds(session, exIndex, seconds) {
  if (!session?.exercises?.[exIndex]) return session
  const restSeconds = clampInt(seconds, DEFAULT_REST_SECONDS, 0, 600)
  return {
    ...session,
    exercises: session.exercises.map((ex, i) => (i === exIndex ? { ...ex, restSeconds } : ex)),
  }
}

/** Distinct exercises with at least one completed set (for workout logs). */
export function completedExerciseCount(session) {
  return (session?.exercises || []).filter((ex) => ex.sets?.some(Boolean)).length
}

/** Where to go after finishing a set. Never mutates the session. */
export function nextPosition(session, exIndex, setIndex) {
  const list = session?.exercises || []
  const current = list[exIndex]
  if (!current) return { exIndex: 0, setIndex: 0, done: true }
  if (setIndex + 1 < current.setCount) {
    return { exIndex, setIndex: setIndex + 1, done: false }
  }
  if (exIndex + 1 < list.length) return { exIndex: exIndex + 1, setIndex: 0, done: false }
  return { exIndex, setIndex, done: true }
}

export function sessionProgress(session) {
  const list = session?.exercises || []
  const total = list.reduce((sum, ex) => sum + ex.setCount, 0)
  const done = list.reduce((sum, ex) => sum + ex.sets.filter(Boolean).length, 0)
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** Flat, log-friendly view of every completed set. */
export function flattenSets(session) {
  return (session?.exercises || []).flatMap((ex) =>
    ex.sets.filter(Boolean).map((record) => ({
      exercise: ex.name,
      set: record.set,
      mode: record.mode,
      target: record.target ?? ex.target,
      reps: record.mode === MODE_REPS ? record.actual : null,
      seconds: record.mode === MODE_TIME ? record.seconds : null,
      weight: record.weight || null,
      source: record.source,
    }))
  )
}

export function persistSession(session, key = SESSION_KEY) {
  try {
    if (session) localStorage.setItem(key, JSON.stringify(session))
    else localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Restore only when the saved exercise list still matches this workout. */
export function restoreSession(exercises, key = SESSION_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved?.signature !== signatureFor(exercises)) return null
    if (!Array.isArray(saved.exercises) || saved.exercises.length !== exercises.length) return null
    return saved
  } catch {
    return null
  }
}
