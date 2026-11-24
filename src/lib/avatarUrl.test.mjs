import assert from 'node:assert/strict'
import test from 'node:test'
import { avatarImageUrl } from './avatarUrl.js'

test('upgrades small Google profile photos', () => {
  const url = 'https://lh3.googleusercontent.com/a/ABC=s96-c'
  assert.equal(avatarImageUrl(url), 'https://lh3.googleusercontent.com/a/ABC=s400-c')
})

test('respects a custom size and preserves extra Google modifiers', () => {
  const url = 'https://lh3.googleusercontent.com/a/ABC=s96-c-rj-mo'
  assert.equal(avatarImageUrl(url, 320), 'https://lh3.googleusercontent.com/a/ABC=s320-c-rj-mo')
})

test('leaves non-Google and empty URLs unchanged', () => {
  const url = 'https://example.com/avatar.jpg'
  assert.equal(avatarImageUrl(url), url)
  assert.equal(avatarImageUrl(''), '')
  assert.equal(avatarImageUrl(null), '')
})
