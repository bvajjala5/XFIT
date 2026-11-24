// One allow-list for workout data that may leave a user's account. Custom
// workouts also contain private fields (for example an AI `prompt`), so both
// community publishing and shared links use this sanitizer.
const PUBLIC_WORKOUT_FIELDS = [
  'id', 'name', 'description', 'type', 'difficulty',
  'estimated_duration', 'estimated_calories', 'is_split_template',
];

const PUBLIC_EXERCISE_FIELDS = [
  'id', 'name', 'sets', 'reps', 'duration', 'duration_seconds',
  'rest_seconds', 'animation', 'notes', 'muscles', 'muscle', 'equipment',
  'image', 'type',
];

function publicExercise(exercise) {
  if (!exercise || typeof exercise !== 'object') return exercise;
  const clean = {};
  for (const key of PUBLIC_EXERCISE_FIELDS) {
    if (exercise[key] !== undefined) clean[key] = exercise[key];
  }
  return clean;
}

/** Copy only the fields that are safe to show outside the owner's account. */
export function toPublicWorkout(workout = {}) {
  const clean = {};
  for (const key of PUBLIC_WORKOUT_FIELDS) {
    if (workout[key] !== undefined) clean[key] = workout[key];
  }
  if (Array.isArray(workout.exercises)) {
    clean.exercises = workout.exercises.map(publicExercise);
  }
  return clean;
}
