import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore/lite';
import { db } from './firestore';
import { toPublicWorkout } from './publicWorkout';

/**
 * Share a custom workout to the global sharedWorkouts collection.
 * The document ID is the original workout ID so it's idempotent.
 */
export async function shareWorkout(userId, displayName, workout) {
  const ref = doc(db, 'sharedWorkouts', workout.id);
  await setDoc(ref, {
    ...toPublicWorkout(workout),
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
  // Increment import counter (best-effort), only when a community doc exists.
  try {
    const { updateDoc, increment } = await import('firebase/firestore/lite');
    await updateDoc(doc(db, 'sharedWorkouts', id), { importCount: increment(1) });
  } catch {}
}
