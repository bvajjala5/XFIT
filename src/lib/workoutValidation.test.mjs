import test from 'node:test'
import assert from 'node:assert/strict'
import {
  expectedWorkoutSeconds,
  isWorkoutTooFast,
  MIN_WORKOUT_DURATION_RATIO,
} from './workoutValidation.js'

test('expected duration uses the exercise time the user chose', () => {
  assert.equal(expectedWorkoutSeconds({ duration: 30 }, 720), 720)
  assert.equal(expectedWorkoutSeconds({ duration: 30, estimated_duration: 25 }, 720), 720)
  assert.equal(expectedWorkoutSeconds({}, 1200), 1200)
})

test('expected duration falls back to the plan when there are no exercises', () => {
  assert.equal(expectedWorkoutSeconds({ duration: 30 }), 1800)
  assert.equal(expectedWorkoutSeconds({ estimated_duration: 24 }), 1440)
  assert.equal(expectedWorkoutSeconds({ duration: 30, estimated_duration: 24 }), 1800)
  assert.equal(expectedWorkoutSeconds({}, 0), 0)
})

test('workouts finished far too quickly do not count', () => {
  const expected = 30 * 60
  assert.equal(isWorkoutTooFast(0, expected), true)
  assert.equal(isWorkoutTooFast(expected * MIN_WORKOUT_DURATION_RATIO - 1, expected), true)
  assert.equal(isWorkoutTooFast(expected * MIN_WORKOUT_DURATION_RATIO, expected), false)
  assert.equal(isWorkoutTooFast(expected, expected), false)
  assert.equal(isWorkoutTooFast(expected * 2, expected), false)
})

test('validation is skipped when the workout has no expected duration', () => {
  assert.equal(isWorkoutTooFast(10, 0), false)
  assert.equal(isWorkoutTooFast(10, undefined), false)
})
