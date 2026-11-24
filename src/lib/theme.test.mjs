import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_WALLPAPER,
  THEME_KEY,
  applyResolvedTheme,
  getThemeMode,
  migrateThemeMode,
  msUntilNextThemeChange,
  resolveTheme,
  setThemeMode,
  wallpaperForTime,
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

test('legacy theme values migrate but auto is kept as a real mode', () => {
  withStorage((store) => {
    store.set(THEME_KEY, 'midnight')
    assert.equal(getThemeMode(), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')

    store.set(THEME_KEY, 'sunrise')
    assert.equal(getThemeMode(), 'alabaster')
    assert.equal(store.get(THEME_KEY), 'alabaster')

    store.set(THEME_KEY, 'auto')
    assert.equal(getThemeMode(), 'auto')
    assert.equal(store.get(THEME_KEY), 'auto')

    for (const removed of ['gradient', 'unknown']) {
      store.set(THEME_KEY, removed)
      assert.equal(getThemeMode(), DEFAULT_WALLPAPER)
      assert.equal(store.get(THEME_KEY), DEFAULT_WALLPAPER)
    }
  })

  assert.equal(migrateThemeMode('midnight'), 'cosmic')
  assert.equal(migrateThemeMode('sunrise'), 'alabaster')
  assert.equal(migrateThemeMode('auto'), 'auto')
  assert.equal(migrateThemeMode('gradient'), 'cosmic')
})

test('auto resolves to Light by day and Dark at night', () => {
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 6, 59)), 'cosmic')
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 7, 0)), 'alabaster')
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 12, 0)), 'alabaster')
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 18, 59)), 'alabaster')
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 19, 0)), 'cosmic')
  assert.equal(wallpaperForTime(new Date(2026, 0, 1, 23, 30)), 'cosmic')

  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 12, 0)), 'alabaster')
  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 22, 0)), 'cosmic')
})

test('the auto timer targets the next 7am/7pm boundary', () => {
  const sixAm = new Date(2026, 0, 1, 6, 0, 0)
  assert.equal(msUntilNextThemeChange(sixAm), 60 * 60 * 1000)

  const noon = new Date(2026, 0, 1, 12, 0, 0)
  assert.equal(msUntilNextThemeChange(noon), 7 * 60 * 60 * 1000)

  const eightPm = new Date(2026, 0, 1, 20, 0, 0)
  assert.equal(msUntilNextThemeChange(eightPm), 11 * 60 * 60 * 1000)
})

test('resolveTheme is an identity for static wallpapers', () => {
  assert.equal(resolveTheme('cosmic'), 'cosmic')
  assert.equal(resolveTheme('alabaster'), 'alabaster')
  assert.equal(resolveTheme('gradient'), 'cosmic')
  assert.equal(resolveTheme('midnight'), 'cosmic')
  assert.equal(resolveTheme('sunrise'), 'alabaster')
  assert.equal(resolveTheme(undefined), DEFAULT_WALLPAPER)
})

test('setThemeMode persists the chosen mode, including auto', () => {
  withStorage((store) => {
    assert.equal(setThemeMode('alabaster'), 'alabaster')
    assert.equal(store.get(THEME_KEY), 'alabaster')
    assert.equal(setThemeMode('midnight'), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')
    assert.equal(setThemeMode('auto', new Date(2026, 0, 1, 22, 0)), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'auto')
    assert.equal(store.has('xfit-gradient-colors'), false)
  })
})

test('applyResolvedTheme is safe to import and call without a DOM', () => {
  assert.equal(applyResolvedTheme('cosmic'), 'cosmic')
  assert.equal(applyResolvedTheme('sunrise'), 'alabaster')
  assert.equal(applyResolvedTheme('auto', new Date(2026, 0, 1, 12, 0)), 'alabaster')
})
