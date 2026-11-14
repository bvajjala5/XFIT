import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore/lite';
import { db } from './firestore';

// Only these fields are ever published. Custom workouts also contain private
// fields (for example the AI `prompt`), so spreading the whole document would
// leak user data to the public community collection.
const PUBLIC_WORKOUT_FIELDS = [
  'name', 'description', 'type', 'difficulty',
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

/**
 * Share a custom workout to the global sharedWorkouts collection.
 * The document ID is the original workout ID so it's idempotent.
 */
export async function shareWorkout(userId, displayName, workout) {
  const ref = doc(db, 'sharedWorkouts', workout.id);
  const publicWorkout = {};
  for (const key of PUBLIC_WORKOUT_FIELDS) {
    if (workout[key] !== undefined) publicWorkout[key] = workout[key];
  }
  if (Array.isArray(workout.exercises)) {
    publicWorkout.exercises = workout.exercises.map(publicExercise);
  }

  await setDoc(ref, {
    ...publicWorkout,
    sharedBy: userId,
    sharedByName: String(displayName || 'Anonymous').slice(0, 100),
    sharedAt: serverTimestamp(),
    importCount: 0,
  });
}

/**
 * Remove a previously shared workout.
 */
export async function unshareWorkout(workoutId) {
  await deleteDoc(doc(db, 'sharedWorkouts', workoutId));
}

/**
 * Check whether a workout is already shared.
 */
export async function isShared(workoutId) {
  const snap = await getDoc(doc(db, 'sharedWorkouts', workoutId));
  return snap.exists();
}

/**
 * Import a shared workout into the current user's customWorkouts.
 */
export async function importWorkout(userId, sharedWorkout) {
  const { id, sharedByName, ...rest } = sharedWorkout;
  const newRef = doc(db, 'users', userId, 'customWorkouts', `imported_${id}`);
  await setDoc(newRef, {
    ...rest,
    importedFrom: id,
    importedFromName: sharedByName,
    created_at: serverTimestamp(),
  });
  // Increment import counter (best-effort)
  try {
    const { updateDoc, increment } = await import('firebase/firestore/lite');
    await updateDoc(doc(db, 'sharedWorkouts', id), { importCount: increment(1) });
  } catch {}
}
