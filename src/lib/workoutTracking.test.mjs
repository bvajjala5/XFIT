import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MODE_REPS, MODE_TIME, DEFAULT_REST_SECONDS,
  detectMode, targetFor, createSession, setExerciseMode, adjust,
  parseQuantity, recordSet, nextPosition, sessionProgress, flattenSets,
  signatureFor, firstIncomplete, setRestSeconds, completedExerciseCount,
} from './workoutTracking.js'
import { normalizeExercise } from './exerciseTiming.js'

const exercises = [
  { name: 'Back Squat', sets: 3, reps: 5, weight: '135 lbs', rest_seconds: 90 },
  { name: 'Plank', duration: 60, interval_seconds: 10 },
  { name: 'Burpees', reps: 15, duration: 45 },
]

test('detectMode respects explicit mode and picks sensible defaults', () => {
  assert.equal(detectMode({ mode: 'time', reps: 10 }), MODE_TIME)
  assert.equal(detectMode({ mode: 'reps', duration: 60 }), MODE_REPS)
  assert.equal(detectMode({ name: 'Back Squat', sets: 4, reps: 8 }), MODE_REPS)
  assert.equal(detectMode({ name: 'Plank', duration: 60 }), MODE_TIME)
  assert.equal(detectMode({ name: 'Burpees', reps: 15, duration: 45 }), MODE_TIME)
  assert.equal(detectMode({ reps: 12 }), MODE_REPS)
  assert.equal(detectMode({ duration: 30 }), MODE_TIME)
})

test('mode is decided before normalizeExercise adds default sets/duration', () => {
  const rawInterval = { name: 'Burpees', reps: 15, duration: 45 }
  const normalizedInterval = normalizeExercise(rawInterval)
  assert.equal(normalizedInterval.sets, 1)
  const interval = createSession([{ ...normalizedInterval, mode: detectMode(rawInterval) }])
  assert.equal(interval.exercises[0].mode, MODE_TIME)
  assert.equal(interval.exercises[0].target, 45)

  const rawStrength = { name: 'Deadlift', sets: 4, reps: 8 }
  const strength = createSession([{ ...normalizeExercise(rawStrength), mode: detectMode(rawStrength) }])
  assert.equal(strength.exercises[0].mode, MODE_REPS)
  assert.equal(strength.exercises[0].target, 8)
})

test('targetFor picks the metric that matches the mode', () => {
  assert.equal(targetFor({ reps: 8, duration: 60 }, MODE_REPS), 8)
  assert.equal(targetFor({ reps: 8, duration: 60 }, MODE_TIME), 60)
  assert.equal(targetFor({}, MODE_REPS), 10)
  assert.equal(targetFor({}, MODE_TIME), 30)
})

test('createSession normalizes sets, targets, rest and intervals without mutating input', () => {
  const snapshot = JSON.stringify(exercises)
  const session = createSession(exercises)
  assert.equal(JSON.stringify(exercises), snapshot)
  assert.equal(session.exercises.length, 3)
  assert.equal(session.exercises[0].mode, MODE_REPS)
  assert.equal(session.exercises[0].setCount, 3)
  assert.equal(session.exercises[0].target, 5)
  assert.equal(session.exercises[0].restSeconds, 90)
  assert.equal(session.exercises[0].weight, '135 lbs')
  assert.equal(session.exercises[1].mode, MODE_TIME)
  assert.equal(session.exercises[1].target, 60)
  assert.equal(session.exercises[1].intervalSeconds, 10)
  assert.equal(session.exercises[1].restSeconds, DEFAULT_REST_SECONDS)
  assert.deepEqual(session.exercises[1].sets, [null])
})

test('setExerciseMode switches the metric and keeps the session immutable', () => {
  const session = createSession(exercises)
  const timed = setExerciseMode(session, 0, MODE_TIME)
  assert.equal(timed.exercises[0].mode, MODE_TIME)
  assert.equal(timed.exercises[0].target, 30)
  assert.equal(session.exercises[0].mode, MODE_REPS)
  assert.equal(setExerciseMode(session, 0, 'bogus'), session)
  assert.equal(setExerciseMode(session, 99, MODE_TIME), session)
})

test('adjust clamps to a safe range and rounds', () => {
  assert.equal(adjust(10, 2), 12)
  assert.equal(adjust(1, -5), 0)
  assert.equal(adjust(99, 5, 0, 100), 100)
  assert.equal(adjust('bad', 2, 0, 10), 2)
})

test('parseQuantity handles plain numbers, clock and spelled-out durations', () => {
  assert.equal(parseQuantity('12'), 12)
  assert.equal(parseQuantity('12 reps'), 12)
  assert.equal(parseQuantity('1:30'), 90)
  assert.equal(parseQuantity('2 min 15 sec'), 135)
  assert.equal(parseQuantity('45s'), 45)
  assert.equal(parseQuantity('', 7), 7)
  assert.equal(parseQuantity('nope', 7), 7)
  assert.equal(parseQuantity(-3), 0)
})

test('recordSet stores one record per set, including source and weight', () => {
  const session = createSession(exercises)
  const next = recordSet(session, 0, 0, {
    actual: 5, seconds: 42, weight: '140 lbs', source: 'camera',
    completedAt: '2026-11-23T10:00:00.000Z',
  })
  assert.equal(next.exercises[0].sets[0].actual, 5)
  assert.equal(next.exercises[0].sets[0].weight, '140 lbs')
  assert.equal(next.exercises[0].sets[0].source, 'camera')
  assert.equal(next.exercises[0].sets[0].completedAt, '2026-11-23T10:00:00.000Z')
  assert.equal(next.exercises[0].sets[1], null)
  assert.equal(session.exercises[0].sets[0], null)
  assert.equal(recordSet(session, 99, 0, {}), session)
})

test('nextPosition walks sets, then exercises, then finishes', () => {
  const session = createSession(exercises)
  assert.deepEqual(nextPosition(session, 0, 0), { exIndex: 0, setIndex: 1, done: false })
  assert.deepEqual(nextPosition(session, 0, 2), { exIndex: 1, setIndex: 0, done: false })
  assert.deepEqual(nextPosition(session, 2, 0), { exIndex: 2, setIndex: 0, done: true })
})

test('sessionProgress and flattenSets report completed work only', () => {
  let session = createSession(exercises)
  assert.deepEqual(sessionProgress(session), { done: 0, total: 5, percent: 0 })
  session = recordSet(session, 0, 0, { actual: 5, seconds: 40 })
  session = recordSet(session, 1, 0, { seconds: 60 })
  assert.deepEqual(sessionProgress(session), { done: 2, total: 5, percent: 40 })
  const flat = flattenSets(session)
  assert.equal(flat.length, 2)
  assert.deepEqual(flat[0], {
    exercise: 'Back Squat', set: 1, mode: MODE_REPS, target: 5, reps: 5,
    seconds: null, weight: '135 lbs', source: 'manual',
  })
  assert.equal(flat[1].reps, null)
  assert.equal(flat[1].seconds, 60)
  assert.equal(flat[1].target, 60)
  assert.equal(flat[1].mode, MODE_TIME)
})

test('signatureFor changes when a workout changes', () => {
  assert.equal(signatureFor(exercises), signatureFor(exercises.map((e) => ({ ...e }))))
  assert.notEqual(signatureFor(exercises), signatureFor(exercises.slice(0, 2)))
  assert.notEqual(
    signatureFor(exercises),
    signatureFor(exercises.map((e, i) => (i === 0 ? { ...e, rest_seconds: 45 } : e)))
  )
})

test('firstIncomplete resumes at the next unfinished set', () => {
  let session = createSession(exercises)
  assert.deepEqual(firstIncomplete(session), { exIndex: 0, setIndex: 0, done: false })
  session = recordSet(session, 0, 0, { actual: 5 })
  session = recordSet(session, 0, 1, { actual: 5 })
  assert.deepEqual(firstIncomplete(session), { exIndex: 0, setIndex: 2, done: false })
  session = recordSet(session, 0, 2, { actual: 5 })
  assert.deepEqual(firstIncomplete(session), { exIndex: 1, setIndex: 0, done: false })
  for (let i = 1; i < exercises.length; i += 1) {
    const count = session.exercises[i].setCount
    for (let s = 0; s < count; s += 1) session = recordSet(session, i, s, { actual: 1 })
  }
  assert.deepEqual(firstIncomplete(session), { exIndex: 0, setIndex: 0, done: true })
})

test('setRestSeconds updates one exercise without touching the others', () => {
  const session = createSession(exercises)
  const next = setRestSeconds(session, 0, 75)
  assert.equal(next.exercises[0].restSeconds, 75)
  assert.equal(next.exercises[1].restSeconds, DEFAULT_REST_SECONDS)
  assert.equal(session.exercises[0].restSeconds, 90)
  assert.equal(setRestSeconds(session, 0, 9999).exercises[0].restSeconds, 600)
})

test('completedExerciseCount counts exercises, not sets', () => {
  let session = createSession(exercises)
  assert.equal(completedExerciseCount(session), 0)
  session = recordSet(session, 0, 0, { actual: 5 })
  session = recordSet(session, 0, 1, { actual: 5 })
  assert.equal(completedExerciseCount(session), 1)
  session = recordSet(session, 1, 0, { seconds: 60 })
  assert.equal(completedExerciseCount(session), 2)
})

test('changing mode keeps historical set metrics intact', () => {
  let session = createSession(exercises)
  session = recordSet(session, 0, 0, { actual: 5, seconds: 0 })
  const next = setExerciseMode(session, 0, MODE_TIME)
  assert.equal(next.exercises[0].sets[0].mode, MODE_REPS)
  assert.equal(next.exercises[0].sets[0].actual, 5)
  assert.equal(next.exercises[0].sets[0].target, 5)
})
