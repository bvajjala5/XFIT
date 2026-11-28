import test from 'node:test'
import assert from 'node:assert/strict'
import { secondsLeftFromInput } from './exerciseTiming.js'

test('typed duration becomes the value shown on the timer', () => {
  assert.equal(secondsLeftFromInput('0:45', 60), 45)
  assert.equal(secondsLeftFromInput(':30', 60), 30)
  assert.equal(secondsLeftFromInput('45s', 60), 45)
  assert.equal(secondsLeftFromInput('1:30', 90), 90)
  // The old behaviour treated the typed value as elapsed time, so a 60-second
  // exercise with "0:45" showed 0:15 left. This guard keeps that bug gone.
  assert.equal(60 - secondsLeftFromInput('0:45', 60), 15)
})

test('typed duration is clamped to the exercise target', () => {
  assert.equal(secondsLeftFromInput('1:30', 60), 60)
  assert.equal(secondsLeftFromInput('2:00', 45), 45)
  assert.equal(secondsLeftFromInput('0', 60), 0)
  assert.equal(secondsLeftFromInput('-5', 60), 0)
})

test('blank or unparseable input keeps the current time left', () => {
  assert.equal(secondsLeftFromInput('', 60, 22), 22)
  assert.equal(secondsLeftFromInput('later', 60, 22), 22)
  assert.equal(secondsLeftFromInput(null, 60, 22), 22)
})
