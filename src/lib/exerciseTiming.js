// One place that decides how long an exercise takes, shared by the player, the plan and the workout templates.
import { parseQuantity } from './workoutTracking.js'

const firstNumber = (v) => { const m = String(v ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null }

/** Accepts library exercises ({duration, reps, sets}) and builder exercises ({duration_seconds, reps:"8-12", rest_seconds}). */
export function normalizeExercise(ex = {}) {
  const sets = Math.max(1, Number(ex.sets) || 1)
  const reps = firstNumber(ex.reps)
  const explicit = Number(ex.duration ?? ex.duration_seconds) || 0
  const duration = explicit || (ex.sets ? sets * (reps || 10) * 3 : 30)
  return { ...ex, sets, duration }
}

export const totalSeconds = (exercises = []) => exercises.reduce((s, e) => s + normalizeExercise(e).duration, 0)
export const totalMinutes = (exercises = []) => Math.max(1, Math.round(totalSeconds(exercises) / 60))

/** "3 sets of 10 reps", "12 reps", "45 seconds" */
export function amountLabel(ex = {}, { short = false } = {}) {
  const sets = Number(ex.sets) || 1
  const hasReps = ex.reps != null && ex.reps !== ''
  if (hasReps) {
    const r = String(ex.reps)
    if (sets > 1) return short ? `${sets} × ${r}` : `${sets} sets of ${r} reps`
    return `${r} reps`
  }
  return `${normalizeExercise(ex).duration} seconds`
}

/**
 * Turn a typed quick-input value into the number of seconds that should be
 * visible on the timer. `0:45` means "show 0:45 left", never "subtract 45
 * seconds from a minute". Values are clamped to the exercise's own target so
 * the display can never exceed the exercise duration.
 */
export function secondsLeftFromInput(raw, targetSeconds, fallbackSeconds = 0) {
  const target = Math.max(0, Math.round(Number(targetSeconds) || 0))
  const fallback = Math.min(target, Math.max(0, Math.round(Number(fallbackSeconds) || 0)))
  const typed = parseQuantity(raw, fallback)
  if (!Number.isFinite(typed)) return fallback
  return Math.min(target, Math.max(0, Math.round(typed)))
}
