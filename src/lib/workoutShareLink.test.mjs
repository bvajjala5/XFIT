import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWorkoutShareUrl, decodeSharedWorkout } from './workoutShareLink.js'

const workout = {
  id: 'abc123',
  name: 'My pushing day',
  type: 'strength',
  estimated_duration: 32,
  prompt: 'Make me a push workout',
  exercises: [
    { id: 'bench', name: 'Bench Press', sets: 3, reps: 8, notes: 'Keep the shoulder blades tight', prompt: 'secret' },
    { id: 'press', name: 'Overhead Press', sets: 3, reps: 10 },
  ],
}

test('shared workout links round-trip without private fields', () => {
  const url = buildWorkoutShareUrl(workout, 'https://xfit.example')
  const token = new URL(url).searchParams.get('share')
  const decoded = decodeSharedWorkout(token)

  assert.equal(decoded.name, 'My pushing day')
  assert.equal(decoded.exercises.length, 2)
  assert.equal(decoded.exercises[0].reps, 8)
  assert.equal(decoded.prompt, undefined)
  assert.equal(decoded.exercises[0].prompt, undefined)
})

test('malformed workout links are rejected', () => {
  assert.throws(() => decodeSharedWorkout('not-a-real-payload'))
})
