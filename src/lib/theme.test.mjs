import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_WALLPAPER,
  THEME_KEY,
  applyResolvedTheme,
  getThemeMode,
  migrateThemeMode,
  resolveTheme,
  setThemeMode,
} from './theme.js'

// A tiny in-memory stand-in: these tests run in Node with no DOM or browser
// storage, and the helpers must work unchanged in that environment.
function withStorage(run) {
  const previous = globalThis.localStorage
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
  try {
    return run(store)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
}

test('legacy theme values migrate to the two static wallpapers', () => {
  withStorage((store) => {
    store.set(THEME_KEY, 'midnight')
    assert.equal(getThemeMode(), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')

    for (const legacy of ['sunrise', 'auto']) {
      store.set(THEME_KEY, legacy)
      assert.equal(getThemeMode(), 'alabaster')
      assert.equal(store.get(THEME_KEY), 'alabaster')
    }

    // A removed gradient preference falls back to the dark wallpaper.
    store.set(THEME_KEY, 'gradient')
    assert.equal(getThemeMode(), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')

    store.set(THEME_KEY, 'unknown')
    assert.equal(getThemeMode(), DEFAULT_WALLPAPER)
    assert.equal(store.get(THEME_KEY), DEFAULT_WALLPAPER)
  })

  assert.equal(migrateThemeMode('midnight'), 'cosmic')
  assert.equal(migrateThemeMode('sunrise'), 'alabaster')
  assert.equal(migrateThemeMode('auto'), 'alabaster')
  assert.equal(migrateThemeMode('gradient'), 'cosmic')
})

test('resolveTheme is an identity for static wallpapers and never reads a clock', () => {
  assert.equal(resolveTheme('cosmic'), 'cosmic')
  assert.equal(resolveTheme('alabaster'), 'alabaster')
  assert.equal(resolveTheme('gradient'), 'cosmic')
  assert.equal(resolveTheme('midnight'), 'cosmic')
  assert.equal(resolveTheme('sunrise'), 'alabaster')
  assert.equal(resolveTheme('auto'), 'alabaster')
  assert.equal(resolveTheme(undefined), DEFAULT_WALLPAPER)
})

test('setThemeMode persists only the wallpaper', () => {
  withStorage((store) => {
    assert.equal(setThemeMode('alabaster'), 'alabaster')
    assert.equal(store.get(THEME_KEY), 'alabaster')
    assert.equal(setThemeMode('midnight'), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')
    assert.equal(store.has('xfit-gradient-colors'), false)
  })
})

test('applyResolvedTheme is safe to import and call without a DOM', () => {
  assert.equal(applyResolvedTheme('cosmic'), 'cosmic')
  assert.equal(applyResolvedTheme('sunrise'), 'alabaster')
})
