import { db } from './firestore'
import { collection, getDocs } from 'firebase/firestore/lite'
import { withBuiltinWorkouts } from './workoutLibrary'

// The built-in library is bundled with the app, but workouts seeded into (or
// added to) Firestore need a local copy too. A gym basement often has no signal,
// so keep the last successful response and read it back when the network fails.
const LIBRARY_KEY = 'xfit_workout_library_cache_v1'
const CUSTOM_PREFIX = 'xfit_custom_workouts_cache_v1_'

function readArray(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // A full or blocked localStorage must never break the online path.
    console.warn('Could not cache workouts:', error)
  }
}

export function readCachedWorkoutLibrary() {
  return readArray(LIBRARY_KEY)
}

export function readCachedCustomWorkouts(uid) {
  return uid ? readArray(CUSTOM_PREFIX + uid) : []
}

/** Find a workout in the offline copy, checking the user's own workouts too. */
export function findCachedWorkout(id, uid) {
  if (!id) return null
  return (
    readCachedWorkoutLibrary().find((workout) => workout.id === id) ||
    readCachedCustomWorkouts(uid).find((workout) => workout.id === id) ||
    null
  )
}

/** Remember a single workout so a deep link still works offline later. */
export function cacheWorkout(workout, uid) {
  if (!workout?.id) return
  const key = workout.isCustom && uid ? CUSTOM_PREFIX + uid : LIBRARY_KEY
  const existing = readArray(key)
  writeArray(key, [workout, ...existing.filter((item) => item.id !== workout.id)])
}

/** Load the shared library, falling back to the cached copy when offline. */
export async function fetchWorkoutLibrary() {
  try {
    const snap = await getDocs(collection(db, 'workouts'))
    const remote = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data(), isCustom: false }))
      .filter((workout) => workout.id !== 'locked-in')
    writeArray(LIBRARY_KEY, remote)
    return withBuiltinWorkouts(remote)
  } catch (error) {
    console.warn('Workout library is offline; using the cached copy.', error)
    return withBuiltinWorkouts(readCachedWorkoutLibrary())
  }
}

/** Load the user's AI/builder workouts, falling back to their cached copy. */
export async function fetchCustomWorkouts(uid) {
  if (!uid) return []
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'customWorkouts'))
    const workouts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), isCustom: true }))
    writeArray(CUSTOM_PREFIX + uid, workouts)
    return workouts
  } catch (error) {
    console.warn('Custom workouts are offline; using the cached copy.', error)
    return readCachedCustomWorkouts(uid)
  }
}
