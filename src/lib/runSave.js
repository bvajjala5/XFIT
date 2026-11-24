import { db } from './firestore'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { formatDistance, normalizeDistanceUnit, unitConfig } from './distanceUnits'
import { saveWorkoutLog } from './workoutLogQueue'

// Firestore rejects undefined field values. Imported rows carry a `source` and
// `title`; GPS runs do not, so drop absent fields instead of writing undefined.
function defined(source) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
}

/**
 * Save a run summary (GPS or imported) through the durable workout-log queue.
 * `id` makes imported runs idempotent: re-importing the same file overwrites
 * the same documents instead of creating duplicates.
 */
export async function saveRun(userId, summary, { id } = {}) {
  if (!userId) throw new Error('A signed-in user is required to save a run')

  const {
    distance = 0,
    elapsed = 0,
    steps = 0,
    calories = 0,
    pace = 0,
    splits = [],
    distanceUnit,
    completedAt,
    title,
    source,
  } = summary || {}
  const unit = normalizeDistanceUnit(distanceUnit)
  const config = unitConfig(unit)
  const distText = formatDistance(distance, unit)
  const when = completedAt || new Date().toISOString()

  const { queued } = await saveWorkoutLog(userId, defined({
    ...(id ? { id } : {}),
    workout_title: title || `Run — ${distText} ${config.short}`,
    workout_type: 'cardio',
    duration_seconds: elapsed,
    calories_burned: calories,
    completedAt: when,
    type: 'run',
    distance,
    pace,
    distance_unit: unit,
    steps,
    source,
  }))

  if (!queued) {
    const runData = defined({
      distance,
      elapsed,
      steps,
      calories,
      pace,
      distance_unit: unit,
      splits: splits.map((split) => ({ ...split })),
      completedAt: serverTimestamp(),
      type: 'run',
      title,
      source,
    })
    try {
      if (id) {
        await setDoc(doc(db, 'users', userId, 'runs', id), runData)
      } else {
        await addDoc(collection(db, 'users', userId, 'runs'), runData)
      }
    } catch (error) {
      // The workout log already succeeded; history is a nice-to-have mirror.
      console.warn('Run history write failed; the workout log was still saved.', error)
    }
  }

  return { queued }
}
