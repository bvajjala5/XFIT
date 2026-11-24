// Small, testable helpers for Uttar AI quotas and entitlements.
// Cloudflare KV is optional: when it is not bound, the proxy keeps working with
// the configured free allowance and simply does not persist usage.

export function envNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function monthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export function periodEndISO(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
}

export function secondsUntilPeriodEnd(now = new Date()) {
  const end = Date.parse(periodEndISO(now))
  return Math.max(60, Math.ceil((end - now.getTime()) / 1000))
}

/** Keep paid entitlements a little past the current billing month. */
export function stripeEntitlementTtl(now = new Date()) {
  return secondsUntilPeriodEnd(now) + 60 * 60 * 24 * 14
}

export function defaultEntitlement(env = {}, now = new Date()) {
  return {
    plan: 'free',
    requestsLimit: envNumber(env.FREE_MONTHLY_REQUESTS, 60),
    tokensLimit: envNumber(env.FREE_MONTHLY_TOKENS, 60000),
    topUpRequests: 0,
    topUpTokens: 0,
    periodEnd: periodEndISO(now),
    updatedAt: now.toISOString(),
  }
}

/** Blend a stored entitlement with safe defaults and configured plan limits. */
export function applyEntitlement(env = {}, stored = null, now = new Date()) {
  const base = defaultEntitlement(env, now)
  if (!stored || typeof stored !== 'object') return base
  const pro = stored.plan === 'pro'
  const planRequests = envNumber(env.PRO_MONTHLY_REQUESTS, 600)
  const planTokens = envNumber(env.PRO_MONTHLY_TOKENS, 600000)

  return {
    ...base,
    plan: pro ? 'pro' : 'free',
    requestsLimit: (pro ? planRequests : base.requestsLimit) + envNumber(stored.topUpRequests, 0),
    tokensLimit: (pro ? planTokens : base.tokensLimit) + envNumber(stored.topUpTokens, 0),
    topUpRequests: envNumber(stored.topUpRequests, 0),
    topUpTokens: envNumber(stored.topUpTokens, 0),
    periodEnd: stored.periodEnd || base.periodEnd,
    customerId: stored.customerId || null,
    subscriptionId: stored.subscriptionId || null,
    updatedAt: stored.updatedAt || base.updatedAt,
  }
}

export function emptyUsage() {
  return { requestsUsed: 0, tokensUsed: 0, byMode: {}, updatedAt: new Date().toISOString() }
}

export function normalizeUsage(stored) {
  if (!stored || typeof stored !== 'object') return emptyUsage()
  return {
    requestsUsed: envNumber(stored.requestsUsed, 0),
    tokensUsed: envNumber(stored.tokensUsed, 0),
    byMode: stored.byMode && typeof stored.byMode === 'object' ? stored.byMode : {},
    updatedAt: stored.updatedAt || null,
  }
}

export function recordUsage(stored, { tokens = 0, mode = 'chat' } = {}) {
  const usage = normalizeUsage(stored)
  const bucket = ['chat', 'workout', 'plan', 'formcheck'].includes(mode) ? mode : 'chat'
  usage.requestsUsed += 1
  usage.tokensUsed += Math.max(0, Number.parseInt(tokens, 10) || 0)
  usage.byMode[bucket] = envNumber(usage.byMode[bucket], 0) + 1
  usage.updatedAt = new Date().toISOString()
  return usage
}

export function usagePayload(entitlement, usage) {
  const requestsUsed = envNumber(usage?.requestsUsed, 0)
  const tokensUsed = envNumber(usage?.tokensUsed, 0)
  const requestsLimit = envNumber(entitlement?.requestsLimit, 0)
  const tokensLimit = envNumber(entitlement?.tokensLimit, 0)
  return {
    plan: entitlement?.plan === 'pro' ? 'pro' : 'free',
    periodEnd: entitlement?.periodEnd || null,
    requestsUsed,
    requestsLimit,
    requestsRemaining: Math.max(0, requestsLimit - requestsUsed),
    tokensUsed,
    tokensLimit,
    tokensRemaining: Math.max(0, tokensLimit - tokensUsed),
    byMode: usage?.byMode || {},
    updatedAt: usage?.updatedAt || null,
  }
}

export async function readJson(kv, key) {
  if (!kv || typeof kv.get !== 'function') return null
  const raw = await kv.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function writeJson(kv, key, value, expirationTtl) {
  if (!kv || typeof kv.put !== 'function') return
  await kv.put(key, JSON.stringify(value), Number.isFinite(expirationTtl) ? { expirationTtl } : undefined)
}

export function topUpAllowance(env = {}, kind = '') {
  if (kind === 'topup-small') {
    return {
      requests: envNumber(env.TOPUP_SMALL_REQUESTS, 50),
      tokens: envNumber(env.TOPUP_SMALL_TOKENS, 50000),
    }
  }
  if (kind === 'topup-large') {
    return {
      requests: envNumber(env.TOPUP_LARGE_REQUESTS, 200),
      tokens: envNumber(env.TOPUP_LARGE_TOKENS, 250000),
    }
  }
  return { requests: 0, tokens: 0 }
}

/** Constant-ish comparison for Stripe webhook signatures. */
export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
