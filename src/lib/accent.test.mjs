import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCENT_KEY,
  DEFAULT_ACCENT,
  applyAccent,
  getAccent,
  migrateAccent,
  setAccent,
} from './accent.js'

function withStorage(saved, run) {
  const original = globalThis.localStorage
  const values = new Map(saved === null ? [] : [[ACCENT_KEY, saved]])
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
  try {
    return { ...run(values), saved: values.get(ACCENT_KEY) ?? null }
  } finally {
    if (original === undefined) delete globalThis.localStorage
    else globalThis.localStorage = original
  }
}

test('only the two supported accent presets are accepted', () => {
  assert.equal(migrateAccent('blueprint'), 'blueprint')
  assert.equal(migrateAccent('neutral'), DEFAULT_ACCENT)
  assert.equal(migrateAccent('rainbow'), DEFAULT_ACCENT)
  assert.equal(migrateAccent(null), DEFAULT_ACCENT)
})

test('invalid saved accents migrate to neutral once', () => {
  withStorage('rainbow', () => {
    assert.equal(getAccent(), DEFAULT_ACCENT)
  })
  const stored = withStorage('rainbow', () => ({ result: getAccent() }))
  assert.equal(stored.saved, DEFAULT_ACCENT)
})

test('selecting an accent persists it', () => {
  const selected = withStorage(null, () => ({ result: setAccent('blueprint') }))
  assert.equal(selected.result, 'blueprint')
  assert.equal(selected.saved, 'blueprint')
})

test('applying an accent is safe without a DOM', () => {
  const originalDocument = globalThis.document
  delete globalThis.document
  try {
    assert.equal(applyAccent('blueprint'), 'blueprint')
    assert.equal(applyAccent('unexpected'), DEFAULT_ACCENT)
  } finally {
    if (originalDocument !== undefined) globalThis.document = originalDocument
  }
})
