// Saving AI-built workouts and weekly plans. Kept in one place so the Uttar AI tab and the
// Build Workout page write the same document shape the player and the Plan page already read.
import { db } from '@/lib/firebase'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { restEntry, workoutEntry } from '@/lib/weeklyPlan'
import { totalMinutes } from '@/lib/exerciseTiming'

export function workoutDocFromAI(workout, prompt = '') {
  const minutes = Math.max(1, Number(workout.estimated_duration) || totalMinutes(workout.exercises))
  return {
    name: workout.name,
    title: workout.name,
    type: 'strength',
    difficulty: workout.difficulty || 'intermediate',
    description: '',
    exercises: workout.exercises,
    duration: minutes,
    estimated_duration: minutes,
    calories_estimate: Number(workout.estimated_calories) || minutes * 7,
    source: 'uttar_ai',
    prompt: prompt || '',
    created_at: serverTimestamp(),
  }
}

/** Save a single AI workout to users/{uid}/customWorkouts and return its id. */
export async function saveAIWorkout(uid, workout, prompt = '') {
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'users', uid, 'customWorkouts'))
  batch.set(ref, workoutDocFromAI(workout, prompt))
  await batch.commit()
  return ref.id
}

/**
 * Save a generated week to the schedule. Each training day gets its own customWorkout doc so it
 * opens in the normal player. Days not present in `days` are left untouched.
 * @param {Array<{dayKey:string,isRest:boolean,title:string,minutes:number,difficulty:string,exercises:object[]}>} days
 */
export async function saveAIWeeklyPlan(uid, days, prompt = '') {
  const batch = writeBatch(db)
  const workoutIds = []

  for (const day of days) {
    if (!day?.dayKey) continue
    if (day.isRest || !day.exercises?.length) {
      batch.set(doc(db, 'users', uid, 'schedule', day.dayKey), { ...restEntry(day.dayKey), updatedAt: new Date() })
      continue
    }

    const ref = doc(collection(db, 'users', uid, 'customWorkouts'))
    const workout = {
      name: day.title,
      exercises: day.exercises,
      estimated_duration: day.minutes,
      difficulty: day.difficulty,
    }
    batch.set(ref, workoutDocFromAI(workout, prompt))
    const entry = workoutEntry(day.dayKey, day.title, {
      id: ref.id,
      title: day.title,
      minutes: day.minutes,
      difficulty: day.difficulty,
      custom: true,
    })
    batch.set(doc(db, 'users', uid, 'schedule', day.dayKey), { ...entry, updatedAt: new Date() })
    workoutIds.push(ref.id)
  }

  await batch.commit()
  return workoutIds
}
