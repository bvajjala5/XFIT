// A workout only counts when the active time is plausible for the plan. Skipping
// through a 30 minute session in two minutes should not earn a log, a streak, or
// a "workout complete" record.
export const MIN_WORKOUT_DURATION_RATIO = 0.5

/**
 * Expected workout length in seconds.
 *
 * The player knows the exact durations the user picked on the sliders (including
 * per-exercise overrides), so that total wins over the workout's rounded plan
 * duration. Only fall back to the plan when there are no exercises to measure.
 */
export function expectedWorkoutSeconds(workout, actualSeconds = 0) {
  if (Number.isFinite(actualSeconds) && actualSeconds > 0) return actualSeconds
  const minutes = Number(workout?.duration ?? workout?.estimated_duration)
  if (Number.isFinite(minutes) && minutes > 0) return minutes * 60
  return 0
}

/** True when the elapsed time is too short for the workout to be legitimate. */
export function isWorkoutTooFast(totalSeconds, expectedSeconds) {
  if (!Number.isFinite(expectedSeconds) || expectedSeconds <= 0) return false
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return true
  return totalSeconds < expectedSeconds * MIN_WORKOUT_DURATION_RATIO
}
