import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Share a custom workout to the global sharedWorkouts collection.
 * The document ID is the original workout ID so it's idempotent.
 */
export async function shareWorkout(userId, displayName, workout) {
  const ref = doc(db, 'sharedWorkouts', workout.id);
  await setDoc(ref, {
    ...workout,
    sharedBy: userId,
    sharedByName: displayName || 'Anonymous',
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
  const { id, sharedBy, sharedByName, sharedAt, importCount, ...rest } = sharedWorkout;
  const newRef = doc(db, 'users', userId, 'customWorkouts', `imported_${id}`);
  await setDoc(newRef, {
    ...rest,
    importedFrom: id,
    importedFromName: sharedByName,
    created_at: serverTimestamp(),
  });
  // Increment import counter (best-effort)
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    await updateDoc(doc(db, 'sharedWorkouts', id), { importCount: increment(1) });
  } catch (_) {}
}
