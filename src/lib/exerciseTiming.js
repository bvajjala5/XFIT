// One place that decides how long an exercise takes, shared by the player, the plan and the workout templates.
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
