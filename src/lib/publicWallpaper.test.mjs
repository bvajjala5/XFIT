import test from 'node:test'
import assert from 'node:assert/strict'

// The module reads sessionStorage when it loads, so each case installs a fresh
// in-memory stand-in before importing a uniquely cached copy of the module.
async function withStorage(run) {
  const previous = globalThis.sessionStorage
  const store = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  }
  try {
    return await run(store)
  } finally {
    if (previous === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previous
  }
}

test('the preview wallpaper starts light and does not touch the saved app theme', async () => {
  await withStorage(async (store) => {
    const { getPublicWallpaper, setPublicWallpaper, subscribePublicWallpaper } = await import('./publicWallpaper.js')

    assert.equal(getPublicWallpaper(), 'alabaster')

    const seen = []
    const unsubscribe = subscribePublicWallpaper((value) => seen.push(value))
    assert.equal(setPublicWallpaper('cosmic'), 'cosmic')
    assert.equal(getPublicWallpaper(), 'cosmic')
    assert.equal(store.get('xfit-public-wallpaper'), 'cosmic')
    assert.deepEqual(seen, ['cosmic'])
    assert.equal(store.has('xfit-theme'), false)

    unsubscribe()
    setPublicWallpaper('alabaster')
    assert.deepEqual(seen, ['cosmic'])
  })
})

test('an unknown preview value falls back to light', async () => {
  await withStorage(async (store) => {
    const { getPublicWallpaper, setPublicWallpaper } = await import('./publicWallpaper.js?case=unknown')

    setPublicWallpaper('cosmic')
    assert.equal(setPublicWallpaper('gradient'), 'alabaster')
    assert.equal(getPublicWallpaper(), 'alabaster')
    assert.equal(store.get('xfit-public-wallpaper'), 'alabaster')
  })
})

test('a dark preview saved earlier is restored on load', async () => {
  await withStorage(async (store) => {
    store.set('xfit-public-wallpaper', 'cosmic')
    const { getPublicWallpaper } = await import('./publicWallpaper.js?case=restored')

    assert.equal(getPublicWallpaper(), 'cosmic')
  })
})
