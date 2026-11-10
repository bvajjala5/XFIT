import test from 'node:test'
import assert from 'node:assert/strict'
import { autoTheme, resolveTheme } from './theme.js'

test('auto theme switches at 6am and 7pm', () => {
  assert.equal(autoTheme(new Date(2026, 0, 1, 5, 59)), 'midnight')
  assert.equal(autoTheme(new Date(2026, 0, 1, 6, 0)), 'sunrise')
  assert.equal(autoTheme(new Date(2026, 0, 1, 18, 59)), 'sunrise')
  assert.equal(autoTheme(new Date(2026, 0, 1, 19, 0)), 'midnight')
})

test('explicit theme modes ignore the clock', () => {
  assert.equal(resolveTheme('sunrise'), 'sunrise')
  assert.equal(resolveTheme('midnight'), 'midnight')
})
