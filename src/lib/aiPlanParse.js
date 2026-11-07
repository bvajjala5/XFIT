// Turns a model reply into the app's workout / weekly-plan shapes.
// The model is asked for JSON-only output, but models sometimes wrap it in fences or prose,
// so this parser is deliberately forgiving about the wrapper and strict about the contents.
import { totalMinutes } from './exerciseTiming.js'

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const DAY_ALIASES = {
  mon: 'monday', monday: 'monday', tue: 'tuesday', tues: 'tuesday', tuesday: 'tuesday',
  wed: 'wednesday', weds: 'wednesday', wednesday: 'wednesday', thu: 'thursday', thur: 'thursday',
  thurs: 'thursday', thursday: 'thursday', fri: 'friday', friday: 'friday', sat: 'saturday',
  saturday: 'saturday', sun: 'sunday', sunday: 'sunday',
}
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

function tryParse(text) {
  try { return JSON.parse(text) } catch { return null }
}

// Find the first balanced {...} / [...] block, respecting strings so braces in notes don't break it.
function balancedSlice(text) {
  const match = /[[{]/.exec(text)
  if (!match) return null
  const start = match.index
  const open = text[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/** Pull the first JSON object out of a reply, with or without markdown fences / surrounding prose. */
export function extractJSON(text) {
  if (typeof text !== 'string') return null
  const trimmed = text.trim().replace(/^\uFEFF/, '')
  if (!trimmed) return null

  const direct = tryParse(trimmed)
  if (direct && typeof direct === 'object') return direct

  const fence = trimmed.match(/```(?:json|javascript|js)?\s*([\s\S]*?)```/i)
  if (fence) {
    const inside = fence[1].trim()
    const fenced = tryParse(inside)
    if (fenced && typeof fenced === 'object') return fenced
    const sliced = balancedSlice(inside)
    const parsed = sliced && tryParse(sliced)
    if (parsed && typeof parsed === 'object') return parsed
  }

  const sliced = balancedSlice(trimmed)
  const parsed = sliced && tryParse(sliced)
  return parsed && typeof parsed === 'object' ? parsed : null
}

/** "Mon", "TUESDAY", "day 3" -> the lowercase weekday key used in the schedule collection. */
export function resolveWeekday(value) {
  if (value == null) return null
  const key = String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (DAY_ALIASES[key]) return DAY_ALIASES[key]
  const numbered = key.match(/^(?:day|d)([1-7])$/)
  if (numbered) return DAY_KEYS[Number(numbered[1]) - 1]
  return null
}

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

/** Match a movement to one of the app's built-in exercise animations. */
export function guessAnimation(name = '') {
  const n = String(name).toLowerCase()
  if (n.includes('curl') || n.includes('bicep')) return 'curl'
  if (n.includes('push') || (n.includes('press') && n.includes('chest'))) return 'push_up'
  if (n.includes('squat')) return 'squat'
  if (n.includes('lateral') || (n.includes('raise') && n.includes('side'))) return 'lateral_raise'
  if (n.includes('plank') || n.includes('hold')) return 'plank'
  if (n.includes('lunge') || n.includes('split')) return 'lunge'
  if (n.includes('twist') || n.includes('russian')) return 'russian_twist'
  if (n.includes('hip') || n.includes('glute') || n.includes('bridge')) return 'hip_raise'
  if (n.includes('press') || n.includes('shoulder') || n.includes('overhead')) return 'overhead_press'
  if (n.includes('jump') || n.includes('hop') || n.includes('jack')) return 'jump'
  return 'squat'
}

export function normalizeExercise(raw = {}) {
  const name = String(raw.name || raw.exercise || raw.title || '').trim()
  if (!name) return null
  const rawDuration = raw.duration_seconds ?? raw.durationSeconds ?? raw.duration ?? null
  const duration = rawDuration == null || rawDuration === '' ? null : Number(rawDuration)
  return {
    id: raw.id != null ? String(raw.id) : null,
    name,
    sets: clampInt(raw.sets ?? raw.rounds, 1, 20, 3),
    reps: raw.reps == null || raw.reps === '' ? '10' : String(raw.reps),
    duration_seconds: Number.isFinite(duration) && duration > 0 ? Math.min(600, Math.round(duration)) : null,
    rest_seconds: clampInt(raw.rest_seconds ?? raw.rest, 0, 300, 45),
    notes: String(raw.notes || raw.instructions || raw.tip || '').trim().slice(0, 400),
    animation: guessAnimation(name),
  }
}

let exerciseSeq = 0
function withIds(exercises) {
  return exercises.map((ex) => ({ ...ex, id: ex.id || `ex-${Date.now().toString(36)}-${++exerciseSeq}` }))
}

export function normalizeWorkout(raw = {}, fallbackName = 'AI Workout') {
  const list = raw.exercises || raw.exercise_list || raw.movements || []
  const exercises = withIds(Array.isArray(list) ? list.map(normalizeExercise).filter(Boolean) : [])
  if (!exercises.length) return null

  const minutes = clampInt(
    raw.estimated_duration ?? raw.workout_duration ?? raw.duration ?? raw.minutes,
    1, 240, totalMinutes(exercises)
  )
  const difficulty = DIFFICULTIES.includes(String(raw.difficulty || '').toLowerCase())
    ? String(raw.difficulty).toLowerCase()
    : 'intermediate'
  const calories = clampInt(
    raw.estimated_calories ?? raw.calories ?? raw.calories_estimate,
    10, 3000, minutes * 7
  )
  return {
    name: String(raw.name || raw.title || raw.workout_title || fallbackName).trim().slice(0, 100) || fallbackName,
    estimated_duration: minutes,
    estimated_calories: calories,
    difficulty,
    exercises,
  }
}

/** Accepts either { Monday: {...} } or [{ day: 'Monday', ... }] and returns Monday-first entries. */
export function normalizePlan(raw = {}) {
  const plan = raw.plan || raw.weekly_plan || raw.days || (Array.isArray(raw) ? raw : null)
  const found = new Map()

  if (Array.isArray(plan)) {
    plan.forEach((item) => {
      if (!item || typeof item !== 'object') return
      const dayKey = resolveWeekday(item.day ?? item.weekday ?? item.day_of_week ?? item.name)
      if (dayKey) found.set(dayKey, item)
    })
  } else if (plan && typeof plan === 'object') {
    Object.entries(plan).forEach(([key, value]) => {
      const dayKey = resolveWeekday(key)
      if (!dayKey) return
      if (typeof value === 'string') found.set(dayKey, { type: 'rest', label: value })
      else if (value && typeof value === 'object') found.set(dayKey, value)
    })
  }

  return DAY_KEYS.filter((key) => found.has(key)).map((dayKey) => {
    const data = found.get(dayKey)
    const exercises = withIds(Array.isArray(data.exercises)
      ? data.exercises.map(normalizeExercise).filter(Boolean)
      : [])
    const isRest = data.type === 'rest' || data.is_rest_day === true || exercises.length === 0
    const rawTitle = data.workout_title || data.title || data.label || (isRest ? 'Rest' : 'Workout')
    const minutes = clampInt(
      data.workout_duration ?? data.duration ?? data.estimated_duration,
      0, 240, exercises.length ? totalMinutes(exercises) : 0
    )
    return {
      dayKey,
      dayLabel: DAY_LABELS[dayKey],
      isRest,
      title: String(rawTitle).trim().slice(0, 100) || 'Rest',
      minutes,
      difficulty: DIFFICULTIES.includes(String(data.workout_difficulty || data.difficulty || '').toLowerCase())
        ? String(data.workout_difficulty || data.difficulty).toLowerCase()
        : 'intermediate',
      exercises,
    }
  })
}

/**
 * @returns {{kind:'workout', workout:object} | {kind:'plan', days:object[]} | null}
 */
export function parseAIResponse(text) {
  const json = extractJSON(text)
  if (!json) return null

  if (json.type === 'plan' || json.plan || json.weekly_plan || json.days) {
    const days = normalizePlan(json)
    if (days.length) return { kind: 'plan', days }
  }

  const wrapped = json.workout && typeof json.workout === 'object' ? json.workout : json
  const workout = normalizeWorkout(wrapped, json.workout_title || json.title)
  return workout ? { kind: 'workout', workout } : null
}
