import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EVENT_ALLOWLIST,
  buildAnalyticsPatch,
  localDateKey,
  mergeAnalyticsPatches,
  sanitizeBucket,
} from './usageAnalyticsShared.js'

test('localDateKey uses the local calendar day', () => {
  assert.equal(localDateKey(new Date(2026, 10, 24, 23, 59)), '2026-11-24')
})

test('sanitizeBucket keeps only small safe buckets', () => {
  assert.equal(sanitizeBucket('Workout started?!'), 'workout-started')
  assert.equal(sanitizeBucket(''), 'other')
  assert.equal(sanitizeBucket(null), 'other')
  assert.equal(sanitizeBucket('a'.repeat(100)).length, 40)
})

test('buildAnalyticsPatch drops unknown events and raw values', () => {
  const patch = buildAnalyticsPatch([
    { name: 'workout_started', props: { workoutType: 'builtin', rawName: 'Secret workout', platform: 'web' } },
    { name: 'not_an_event', props: { anything: true } },
  ])

  assert.equal(patch.counts.workout_started, 1)
  assert.equal(patch.counts.not_an_event, undefined)
  assert.deepEqual(patch.breakdowns.workout_started.workoutType, { builtin: 1 })
  assert.equal(patch.breakdowns.workout_started.rawName, undefined)
})

test('buildAnalyticsPatch merges repeated events', () => {
  const patch = buildAnalyticsPatch([
    { name: 'ai_request', props: { mode: 'chat' } },
    { name: 'ai_request', props: { mode: 'chat' } },
    { name: 'ai_request', props: { mode: 'workout' } },
  ])
  assert.equal(patch.counts.ai_request, 3)
  assert.deepEqual(patch.breakdowns.ai_request.mode, { chat: 2, workout: 1 })
})

test('mergeAnalyticsPatches adds counts without losing buckets', () => {
  const a = buildAnalyticsPatch([{ name: 'food_logged', props: { source: 'usda' } }])
  const b = buildAnalyticsPatch([
    { name: 'food_logged', props: { source: 'usda' } },
    { name: 'food_logged', props: { source: 'online' } },
  ])
  mergeAnalyticsPatches(a, b)
  assert.equal(a.counts.food_logged, 3)
  assert.deepEqual(a.breakdowns.food_logged.source, { usda: 2, online: 1 })
})

test('allowlist contains only count-safe product events', () => {
  const names = Object.keys(EVENT_ALLOWLIST)
  assert.ok(names.includes('app_opened'))
  assert.ok(names.includes('health_permission_granted'))
  assert.ok(names.includes('ai_rate_limited'))
  assert.ok(!names.some((name) => /message|content|value|note|email|uid/i.test(name)))
})
