// A workout only counts when the active time is plausible for the plan. Skipping
// through a 30 minute session in two minutes should not earn a log, a streak, or
// a "workout complete" record.
export const MIN_WORKOUT_DURATION_RATIO = 0.5

/** Expected workout length in seconds, from the plan or a computed fallback. */
export function expectedWorkoutSeconds(workout, fallbackSeconds = 0) {
  const minutes = Number(workout?.duration ?? workout?.estimated_duration)
  if (Number.isFinite(minutes) && minutes > 0) return minutes * 60
  return Number.isFinite(fallbackSeconds) && fallbackSeconds > 0 ? fallbackSeconds : 0
}

/** True when the elapsed time is too short for the workout to be legitimate. */
export function isWorkoutTooFast(totalSeconds, expectedSeconds) {
  if (!Number.isFinite(expectedSeconds) || expectedSeconds <= 0) return false
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return true
  return totalSeconds < expectedSeconds * MIN_WORKOUT_DURATION_RATIO
}
