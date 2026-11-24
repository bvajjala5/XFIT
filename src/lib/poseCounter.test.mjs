import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MOVEMENTS, SUPPORTED_MOVEMENTS, movementFromExercise, point, distance,
  angleAt, confidenceFor, confidenceLabel, initialCounter, updateRepCounter,
} from './poseCounter.js'

const makeLandmarks = (overrides = {}, visibility = 1) =>
  Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility }))
    .map((p, i) => ({ ...p, ...(overrides[i] || {}) }))

const squatDown = () => makeLandmarks({
  23: { x: 0.4, y: 0.45 }, 25: { x: 0.2, y: 0.65 }, 27: { x: 0.4, y: 0.85 },
  24: { x: 0.6, y: 0.45 }, 26: { x: 0.8, y: 0.65 }, 28: { x: 0.6, y: 0.85 },
})
const squatUp = () => makeLandmarks({
  23: { x: 0.4, y: 0.45 }, 25: { x: 0.4, y: 0.67 }, 27: { x: 0.4, y: 0.88 },
  24: { x: 0.6, y: 0.45 }, 26: { x: 0.6, y: 0.67 }, 28: { x: 0.6, y: 0.88 },
})

test('point and distance handle missing landmarks', () => {
  const lm = makeLandmarks()
  assert.ok(point(lm, 0))
  assert.equal(point(lm, 99), null)
  assert.equal(point([{ x: 'bad', y: 1 }], 0), null)
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
  assert.equal(distance(null, { x: 0, y: 0 }), null)
})

test('angleAt measures a right angle and rejects missing points', () => {
  assert.equal(angleAt({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }), 90)
  assert.equal(angleAt(null, { x: 0, y: 0 }, { x: 1, y: 0 }), null)
})

test('confidence uses only the landmarks the movement needs', () => {
  const squatLow = makeLandmarks({}, 0.4)
  squatLow[23].visibility = 0.9
  assert.ok(Math.abs(confidenceFor(squatLow, 'squat') - 0.4833) < 0.001)
  assert.equal(confidenceFor([], 'squat'), 0)
  assert.equal(confidenceFor(squatDown(), 'squat'), 1)
  assert.equal(confidenceLabel(0.8), 'good')
  assert.equal(confidenceLabel(0.6), 'fair')
  assert.equal(confidenceLabel(0.2), 'low')
})

test('movementFromExercise maps supported names', () => {
  assert.equal(movementFromExercise('Back Squat'), 'squat')
  assert.equal(movementFromExercise('Plyo Push-Ups'), 'pushup')
  assert.equal(movementFromExercise('Dumbbell Bicep Curls'), 'curl')
  assert.equal(movementFromExercise('Overhead Press'), 'press')
  assert.equal(movementFromExercise('Jumping Jacks'), 'jacks')
  assert.equal(movementFromExercise('Plank'), null)
  assert.deepEqual(SUPPORTED_MOVEMENTS, ['squat', 'pushup', 'curl', 'press', 'jacks'])
  assert.ok(Object.values(MOVEMENTS).every((m) => m.label && m.hint && m.points.length))
})

test('a squat counts only after the bottom position is seen', () => {
  let state = initialCounter()
  state = updateRepCounter(state, squatUp(), 'squat', { now: 1000 }) // already standing
  assert.equal(state.count, 0)
  assert.equal(state.phase, 'ready')
  state = updateRepCounter(state, squatDown(), 'squat', { now: 1100 })
  assert.equal(state.count, 0)
  assert.equal(state.phase, 'armed')
  state = updateRepCounter(state, squatUp(), 'squat', { now: 1200 })
  assert.equal(state.count, 1)
  assert.equal(state.phase, 'ready')
  state = updateRepCounter(state, squatDown(), 'squat', { now: 1300 })
  state = updateRepCounter(state, squatUp(), 'squat', { now: 1600 })
  assert.equal(state.count, 2)
})

test('low confidence and unsupported movements never count', () => {
  const low = makeLandmarks({}, 0.2)
  let state = initialCounter()
  state = updateRepCounter(state, low, 'squat', { now: 0 })
  assert.equal(state.reliable, false)
  state = updateRepCounter(state, squatUp(), 'squat', { now: 2000 })
  assert.equal(state.count, 0) // a low-confidence frame cannot arm the rep
  assert.equal(state.reliable, true)
  assert.equal(updateRepCounter(state, squatUp(), 'bogus', { now: 2200 }).count, 0)
})

test('rapid frames are debounced so one rep cannot double-count', () => {
  let state = initialCounter()
  state = updateRepCounter(state, squatDown(), 'squat', { now: 1000 })
  state = updateRepCounter(state, squatUp(), 'squat', { now: 1100 })
  assert.equal(state.count, 1)
  state = updateRepCounter(state, squatDown(), 'squat', { now: 1200 })
  state = updateRepCounter(state, squatUp(), 'squat', { now: 1300 })
  assert.equal(state.count, 1) // inside 350ms window
  state = updateRepCounter(state, squatDown(), 'squat', { now: 1400 })
  state = updateRepCounter(state, squatUp(), 'squat', { now: 2000 })
  assert.equal(state.count, 2)
})

test('bicep curls count in the opposite direction', () => {
  const straight = makeLandmarks({
    11: { x: 0.42, y: 0.35 }, 13: { x: 0.42, y: 0.55 }, 15: { x: 0.42, y: 0.75 },
    12: { x: 0.58, y: 0.35 }, 14: { x: 0.58, y: 0.55 }, 16: { x: 0.58, y: 0.75 },
  })
  const bent = makeLandmarks({
    11: { x: 0.42, y: 0.35 }, 13: { x: 0.42, y: 0.55 }, 15: { x: 0.20, y: 0.42 },
    12: { x: 0.58, y: 0.35 }, 14: { x: 0.58, y: 0.55 }, 16: { x: 0.80, y: 0.42 },
  })
  let state = initialCounter()
  state = updateRepCounter(state, straight, 'curl', { now: 0 })
  assert.equal(state.phase, 'armed')
  state = updateRepCounter(state, bent, 'curl', { now: 400 })
  assert.equal(state.count, 1)
})
