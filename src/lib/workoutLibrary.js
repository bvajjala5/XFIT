import { BUILTIN_WORKOUTS } from '@/lib/seedWorkouts';

// The built-in workout library is bundled with the app so a fresh deployment is
// usable immediately. The Firestore `workouts` collection is optional and, when
// populated, overrides a built-in entry with the same id.
export function withBuiltinWorkouts(remote = []) {
  const remoteIds = new Set(remote.map(workout => workout.id));
  const missing = BUILTIN_WORKOUTS.filter(workout => !remoteIds.has(workout.id));
  return [...missing, ...remote];
}

export function findBuiltinWorkout(id) {
  if (!id) return null;
  return BUILTIN_WORKOUTS.find(workout => workout.id === id) ?? null;
}
