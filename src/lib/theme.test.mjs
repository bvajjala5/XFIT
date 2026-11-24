import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_GRADIENT_COLORS,
  DEFAULT_WALLPAPER,
  GRADIENT_KEY,
  THEME_KEY,
  applyResolvedTheme,
  getGradientColors,
  getThemeMode,
  gradientChromeColor,
  gradientNavColors,
  migrateThemeMode,
  normalizeGradientColors,
  resolveTheme,
  setGradientColors,
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

test('legacy theme values migrate to the three static wallpapers', () => {
  withStorage((store) => {
    store.set(THEME_KEY, 'midnight')
    assert.equal(getThemeMode(), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')

    for (const legacy of ['sunrise', 'auto']) {
      store.set(THEME_KEY, legacy)
      assert.equal(getThemeMode(), 'alabaster')
      assert.equal(store.get(THEME_KEY), 'alabaster')
    }

    store.set(THEME_KEY, 'unknown')
    assert.equal(getThemeMode(), DEFAULT_WALLPAPER)
    assert.equal(store.get(THEME_KEY), DEFAULT_WALLPAPER)
  })

  assert.equal(migrateThemeMode('midnight'), 'cosmic')
  assert.equal(migrateThemeMode('sunrise'), 'alabaster')
  assert.equal(migrateThemeMode('auto'), 'alabaster')
})

test('resolveTheme is an identity for static wallpapers and never reads a clock', () => {
  assert.equal(resolveTheme('cosmic'), 'cosmic')
  assert.equal(resolveTheme('alabaster'), 'alabaster')
  assert.equal(resolveTheme('gradient'), 'gradient')
  assert.equal(resolveTheme('midnight'), 'cosmic')
  assert.equal(resolveTheme('sunrise'), 'alabaster')
  assert.equal(resolveTheme('auto'), 'alabaster')
  assert.equal(resolveTheme(undefined), DEFAULT_WALLPAPER)
})

test('gradient colors validate hex values and default sensibly', () => {
  assert.deepEqual(normalizeGradientColors(['#1e1b4b', '#0ea5e9']), ['#1e1b4b', '#0ea5e9'])
  assert.deepEqual(normalizeGradientColors(['#abc', '#0ea5e9']), ['#aabbcc', '#0ea5e9'])
  for (const invalid of [null, undefined, '#1e1b4b', ['#1e1b4b'], ['#1e1b4b', '#0ea5e9', '#fff'], ['#zzzzzz', '#0ea5e9'], ['#12345', '#0ea5e9'], ['red', 'blue']]) {
    assert.deepEqual(normalizeGradientColors(invalid), DEFAULT_GRADIENT_COLORS)
  }
  // The browser bar and the nav use the chosen start color, never a blend.
  assert.equal(gradientChromeColor(['#123456', '#abcdef']), '#123456')
  assert.deepEqual(gradientNavColors(['#101010', '#ffffff']), {
    primary: '0 0% 100%', muted: '0 0% 72%', tile: '0 0% 100%', mark: '0 0% 0%',
  })
  assert.deepEqual(gradientNavColors(['#fafafa', '#101010']), {
    primary: '0 0% 0%', muted: '0 0% 28%', tile: '0 0% 0%', mark: '0 0% 100%',
  })
})

test('setGradientColors/getGradientColors store a validated two-color pair', () => {
  withStorage((store) => {
    assert.deepEqual(getGradientColors(), DEFAULT_GRADIENT_COLORS)
    assert.deepEqual(setGradientColors(['#abc', '#0ea5e9']), ['#aabbcc', '#0ea5e9'])
    assert.deepEqual(JSON.parse(store.get(GRADIENT_KEY)), ['#aabbcc', '#0ea5e9'])
    assert.deepEqual(getGradientColors(), ['#aabbcc', '#0ea5e9'])

    assert.deepEqual(setGradientColors('#102030', '#405060'), ['#102030', '#405060'])
    assert.deepEqual(getGradientColors(), ['#102030', '#405060'])

    store.set(GRADIENT_KEY, '{not json')
    assert.deepEqual(getGradientColors(), DEFAULT_GRADIENT_COLORS)
    store.set(GRADIENT_KEY, JSON.stringify(['#nope', '#0ea5e9']))
    assert.deepEqual(getGradientColors(), DEFAULT_GRADIENT_COLORS)
  })
})

test('setThemeMode persists the wallpaper and optional gradient colors together', () => {
  withStorage((store) => {
    assert.equal(setThemeMode('gradient', ['#abc', '#0ea5e9']), 'gradient')
    assert.equal(store.get(THEME_KEY), 'gradient')
    assert.deepEqual(JSON.parse(store.get(GRADIENT_KEY)), ['#aabbcc', '#0ea5e9'])
    assert.equal(setThemeMode('midnight'), 'cosmic')
    assert.equal(store.get(THEME_KEY), 'cosmic')
  })
})

test('applyResolvedTheme is safe to import and call without a DOM', () => {
  assert.equal(applyResolvedTheme('cosmic'), 'cosmic')
  assert.equal(applyResolvedTheme('sunrise'), 'alabaster')
})
