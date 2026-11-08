import { db } from '@/lib/firestore'
import { collection, doc, getDoc, getDocs, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore/lite'
import { TEMPLATES, PRESETS, DAYS } from '@/data/splits'
import { totalMinutes } from '@/lib/exerciseTiming'

// Create the user's own copy of a split workout the first time it's needed (kept as-is if it already exists,
// so edits are never overwritten). Copies live in users/{uid}/customWorkouts and open in the normal player.
export async function ensureTemplate(uid, key) {
  const t = TEMPLATES[key]
  const ref = doc(db, 'users', uid, 'customWorkouts', t.id)
  const snap = await getDoc(ref)
  const minutes = totalMinutes(t.exercises)
  if (!snap.exists()) {
    await setDoc(ref, {
      name: t.title, title: t.title, type: 'strength', category: t.category, difficulty: t.difficulty, equipment: t.equipment,
      description: t.description, exercises: t.exercises, duration: minutes, estimated_duration: minutes,
      calories_estimate: minutes * 7, is_split_template: true, split_key: key, created_at: serverTimestamp(),
    })
  }
  const data = snap.exists() ? snap.data() : { duration: minutes, difficulty: t.difficulty }
  return { id: t.id, title: data.title || data.name || t.title, minutes: data.duration || data.estimated_duration || minutes, difficulty: data.difficulty || t.difficulty }
}

export const restEntry = (dayKey) => ({ day: dayKey, label: 'Rest', is_rest_day: true, workout_id: null, workout_title: '', workout_duration: 0, workout_difficulty: '', is_custom: false })
export const workoutEntry = (dayKey, label, w) => ({
  day: dayKey, label, is_rest_day: false, workout_id: w.id, workout_title: w.title, workout_duration: w.minutes,
  workout_difficulty: w.difficulty || '', is_custom: !!w.custom,
})

export async function saveDay(uid, entry) {
  await setDoc(doc(db, 'users', uid, 'schedule', entry.day), { ...entry, updatedAt: new Date() })
}

export async function applyPreset(uid, presetId) {
  const preset = PRESETS.find((p) => p.id === presetId)
  if (!preset) throw new Error('Unknown plan')
  const needed = [...new Set(preset.week.filter(Boolean))]
  const made = {}
  for (const key of needed) made[key] = await ensureTemplate(uid, key)   // sequential: a handful of small reads/writes
  const batch = writeBatch(db)
  DAYS.forEach(([dayKey], i) => {
    const key = preset.week[i]
    const entry = key ? workoutEntry(dayKey, TEMPLATES[key].label, { ...made[key], custom: true }) : restEntry(dayKey)
    batch.set(doc(db, 'users', uid, 'schedule', dayKey), { ...entry, updatedAt: new Date() })
  })
  await batch.commit()
}

export async function fetchSchedule(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'schedule'))
  const map = {}
  snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() } })
  return map
}
