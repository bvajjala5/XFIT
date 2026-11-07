import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractJSON,
  guessAnimation,
  normalizeExercise,
  parseAIResponse,
  resolveWeekday,
} from './aiPlanParse.js'

test('extractJSON reads a fenced block surrounded by prose', () => {
  const reply = 'Sure! Here you go:\n```json\n{"name":"Leg Day","exercises":[{"name":"Squats","sets":3,"reps":"10"}]}\n```\nEnjoy.'
  const parsed = extractJSON(reply)
  assert.equal(parsed.name, 'Leg Day')
})

test('extractJSON reads raw JSON with braces inside strings', () => {
  const reply = '{"name":"Core","exercises":[{"name":"Plank","notes":"Keep hips {level} and breathe"}]}'
  assert.equal(extractJSON(reply).exercises[0].notes, 'Keep hips {level} and breathe')
})

test('parseAIResponse builds a normalized workout', () => {
  const reply = JSON.stringify({
    name: 'Morning HIIT',
    estimated_duration: 18,
    difficulty: 'Beginner',
    exercises: [
      { name: 'Jumping Jacks', sets: 3, reps: '30', duration_seconds: 30, rest_seconds: 15 },
      { name: 'Push-Ups', sets: 3, reps: '8-12', notes: 'Elbows tucked' },
    ],
  })
  const result = parseAIResponse(reply)
  assert.equal(result.kind, 'workout')
  assert.equal(result.workout.name, 'Morning HIIT')
  assert.equal(result.workout.difficulty, 'beginner')
  assert.equal(result.workout.exercises.length, 2)
  assert.equal(result.workout.exercises[1].reps, '8-12')
  assert.equal(result.workout.exercises[0].animation, 'jump')
  assert.ok(result.workout.exercises[0].id)
  assert.notEqual(result.workout.exercises[0].id, result.workout.exercises[1].id)
})

test('parseAIResponse accepts a workout wrapped in a type field', () => {
  const result = parseAIResponse(JSON.stringify({
    type: 'workout',
    workout: { name: 'Arms', exercises: [{ name: 'Bicep Curls', sets: 3, reps: '12' }] },
  }))
  assert.equal(result.kind, 'workout')
  assert.equal(result.workout.name, 'Arms')
})

test('parseAIResponse reads a plan with weekday aliases and rest days', () => {
  const result = parseAIResponse(JSON.stringify({
    type: 'plan',
    plan: {
      Mon: { type: 'workout', workout_title: 'Push', workout_duration: 40, exercises: [{ name: 'Push-Ups', sets: 3, reps: '12' }] },
      tuesday: { type: 'rest', label: 'Rest Day' },
      WEDNESDAY: { type: 'workout', workout_title: 'Legs', workout_duration: 45, exercises: [{ name: 'Squats', sets: 4, reps: '10' }] },
    },
  }))
  assert.equal(result.kind, 'plan')
  assert.deepEqual(result.days.map((d) => d.dayKey), ['monday', 'tuesday', 'wednesday'])
  assert.equal(result.days[0].title, 'Push')
  assert.equal(result.days[1].isRest, true)
  assert.equal(result.days[1].title, 'Rest Day')
  assert.equal(result.days[2].exercises[0].name, 'Squats')
})

test('parseAIResponse reads a plan given as an array', () => {
  const result = parseAIResponse(JSON.stringify({
    days: [
      { day: 'Friday', workout_title: 'Full body', exercises: [{ name: 'Burpees', sets: 3, reps: '10' }] },
      { day: 'Sunday', type: 'rest' },
    ],
  }))
  assert.equal(result.kind, 'plan')
  assert.deepEqual(result.days.map((d) => d.dayKey), ['friday', 'sunday'])
})

test('a plan workout with no exercises becomes a rest day', () => {
  const result = parseAIResponse(JSON.stringify({
    plan: { Monday: { type: 'workout', workout_title: 'Empty' } },
  }))
  assert.equal(result.kind, 'plan')
  assert.equal(result.days[0].isRest, true)
  assert.equal(result.days[0].title, 'Empty')
})

test('non-JSON chat replies are not treated as workouts', () => {
  assert.equal(parseAIResponse('Try training three times a week and sleeping more.'), null)
  assert.equal(parseAIResponse(''), null)
})

test('resolveWeekday accepts labels, short names, and day numbers', () => {
  assert.equal(resolveWeekday('Mon.'), 'monday')
  assert.equal(resolveWeekday('THURSDAY'), 'thursday')
  assert.equal(resolveWeekday('day 3'), 'wednesday')
  assert.equal(resolveWeekday('Funday'), null)
})

test('normalizeExercise clamps unsafe values and keeps notes', () => {
  const ex = normalizeExercise({ name: 'Plank', sets: 0, rest_seconds: 999, duration_seconds: -5, notes: 'Breathe' })
  assert.equal(ex.sets, 1)
  assert.equal(ex.rest_seconds, 300)
  assert.equal(ex.duration_seconds, null)
  assert.equal(ex.notes, 'Breathe')
  assert.equal(ex.animation, 'plank')
})

test('guessAnimation maps common movements', () => {
  assert.equal(guessAnimation('Romanian Deadlift'), 'squat')
  assert.equal(guessAnimation('Lateral Raises'), 'lateral_raise')
  assert.equal(guessAnimation('Overhead Press'), 'overhead_press')
  assert.equal(guessAnimation('Russian Twists'), 'russian_twist')
})
