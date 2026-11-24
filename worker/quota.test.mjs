import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyEntitlement,
  envNumber,
  monthKey,
  periodEndISO,
  recordUsage,
  safeEqualHex,
  topUpAllowance,
  usagePayload,
} from './quota.js'

const now = new Date('2026-11-24T10:00:00.000Z')

test('envNumber falls back for invalid values', () => {
  assert.equal(envNumber('120', 60), 120)
  assert.equal(envNumber('0', 60), 60)
  assert.equal(envNumber('nope', 60), 60)
})

test('period helpers use UTC calendar month', () => {
  assert.equal(monthKey(now), '2026-11')
  assert.equal(periodEndISO(now), '2026-12-01T00:00:00.000Z')
})

test('applyEntitlement adds top-ups to the active plan', () => {
  const entitlement = applyEntitlement(
    { FREE_MONTHLY_REQUESTS: '60', PRO_MONTHLY_REQUESTS: '600' },
    {
      plan: 'pro',
      topUpRequests: 100,
      topUpTokens: 50000,
      periodEnd: '2026-12-01T00:00:00.000Z',
    },
    now,
  )
  assert.equal(entitlement.plan, 'pro')
  assert.equal(entitlement.requestsLimit, 700)
  assert.equal(entitlement.tokensLimit, 600000 + 50000)
})

test('recordUsage counts requests and tokens by safe mode bucket', () => {
  const usage = recordUsage(null, { tokens: 1200, mode: 'unknown-mode' })
  assert.equal(usage.requestsUsed, 1)
  assert.equal(usage.tokensUsed, 1200)
  assert.equal(usage.byMode.chat, 1)
})

test('usagePayload clamps remaining values at zero', () => {
  const entitlement = applyEntitlement({ FREE_MONTHLY_REQUESTS: '10' }, null, now)
  const payload = usagePayload(entitlement, { requestsUsed: 14, tokensUsed: 3, byMode: {} })
  assert.equal(payload.requestsRemaining, 0)
  assert.equal(payload.tokensRemaining, 59997)
})

test('topUpAllowance reads configured pack sizes', () => {
  assert.deepEqual(topUpAllowance({ TOPUP_SMALL_REQUESTS: '25', TOPUP_SMALL_TOKENS: '1000' }, 'topup-small'), {
    requests: 25,
    tokens: 1000,
  })
  assert.deepEqual(topUpAllowance({}, 'other'), { requests: 0, tokens: 0 })
})

test('safeEqualHex compares signatures', () => {
  assert.equal(safeEqualHex('abc123', 'abc123'), true)
  assert.equal(safeEqualHex('abc123', 'abc124'), false)
  assert.equal(safeEqualHex('abc', 'abcd'), false)
})
