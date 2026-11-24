import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWorkoutShareUrl, decodeSharedWorkout } from './workoutShareLink.js'
import { shareContent } from './shareContent.js'

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

test('shareContent uses the native share sheet when available', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const calls = []
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { share: async (data) => { calls.push(data) } },
  })
  try {
    const result = await shareContent({ title: 'Done', text: 'Nice workout', url: '/home' })
    assert.equal(result, 'shared')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://xfit-bpe.pages.dev/home')
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor)
    else delete globalThis.navigator
  }
})

test('shareContent falls back to copying an absolute link', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  let copied = ''
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { clipboard: { writeText: async (value) => { copied = value } } },
  })
  try {
    const result = await shareContent({ text: 'Nice workout', url: '/home' })
    assert.equal(result, 'copied')
    assert.equal(copied, 'Nice workout\nhttps://xfit-bpe.pages.dev/home')
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor)
    else delete globalThis.navigator
  }
})
