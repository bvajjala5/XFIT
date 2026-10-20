export const LOCKED_IN_DURATION_MINUTES = 25;

export function getExerciseDurationSeconds(exercise) {
  const duration = Number(exercise?.duration ?? exercise?.duration_seconds);
  if (Number.isFinite(duration) && duration > 0) return duration;

  const sets = Number(exercise?.sets);
  const reps = Number(exercise?.reps || 10);
  if (sets > 0 && reps > 0) return sets * reps * 3;
  return 30;
}

export function getWorkoutDurationSeconds(exercises = []) {
  return exercises.reduce((total, exercise) => total + getExerciseDurationSeconds(exercise), 0);
}

export function getWorkoutDurationMinutes(workout) {
  try {
    if (workout?.id && typeof localStorage !== 'undefined') {
      const saved = Number(localStorage.getItem(`xfit_total_duration_${workout.id}`));
      if (Number.isFinite(saved) && saved > 0) return saved;
    }
  } catch { /* Use the workout's default when local storage is unavailable. */ }
  if (workout?.id === 'locked-in') return LOCKED_IN_DURATION_MINUTES;
  return workout?.duration || workout?.estimated_duration || null;
}

export function isCountedWorkout(log) {
  return log?.suspicious !== true && log?.completed !== false && log?.is_partial !== true;
}
