// Privacy-safe product analytics for the Admin Control Hub.
//
// Every value returned from this module is an aggregate (a count, a rate, or a
// small categorical bucket). Document IDs, UIDs, health values, food names,
// prompts and message content never leave the main process. Reads use
// collectionGroup() with .select() and a hard limit, and every source is read
// independently so a missing collection cannot break the page.

import { getAuth, getDb, getProjectId } from './firebase.js'

const DAY_MS = 24 * 60 * 60 * 1000

function envNumber(name, fallback, min, max) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback
}

/** Conservative Gemini-style default, overridable with an env var. */
export const DEFAULT_TOKEN_RATE_PER_MILLION = 0.075
const TOKEN_RATE = envNumber('ADMIN_ANALYTICS_TOKEN_COST_PER_MILLION', DEFAULT_TOKEN_RATE_PER_MILLION, 0, 1000)
const MAX_DOCS = Math.floor(envNumber('ADMIN_ANALYTICS_MAX_DOCS', 20000, 100, 20000))

// Mode buckets used only for the *estimate*. Unknown modes use the 'other'
// bucket so the estimate never silently drops a request.
export const MODE_TOKENS = Object.freeze({ chat: 1200, workout: 2000, plan: 2000, formcheck: 320, other: 1200 })

// Only these telemetry breakdown keys are ever read back. Even if a legacy
// document contains other properties, they are ignored here.
const SAFE_PROPS = Object.freeze([
  'mode',
  'workoutType',
  'reason',
  'source',
  'channel',
  'provider',
  'queued',
  'placement',
  'plan',
  'collection',
  'destination',
  'platform',
  'browser',
  'os',
  'appVersion',
])

const BILLING_NOTE =
  'Exact billing and quota live in Stripe/Gemini. KV-backed server entitlements are not readable by this desktop app.'

/* ── Small helpers ──────────────────────────────────────────────────────── */

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function safeBucket(value) {
  if (value === null || value === undefined) return null
  const text = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return text || null
}

function addBucket(target, value, amount = 1) {
  const key = safeBucket(value)
  if (!key || !Number.isFinite(amount) || amount <= 0) return
  target[key] = (target[key] || 0) + amount
}

function addCount(target, name, value) {
  if (!name || !Number.isFinite(value) || value < 0) return
  target[name] = (target[name] || 0) + value
}

function safeTitle(value) {
  if (typeof value !== 'string') return null
  const title = value.replace(/\s+/g, ' ').trim().slice(0, 60)
  return title || null
}

function dateKeyFromMs(ms) {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function numeric(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max ? number : null
}

function errorNote(error) {
  const code = error?.code
  if (typeof code === 'string' && code) return `Unable to read (${code}).`
  return 'Unable to read — the collection may not exist or may need a Firestore index.'
}

async function safeRead(label, warnings, fn, fallback = null) {
  try {
    return await fn()
  } catch (error) {
    console.error(`[analytics] ${label} read failed:`, error?.message || error)
    warnings.push({ section: label, message: errorNote(error) })
    return fallback
  }
}

function baseSection(extra = {}) {
  return {
    available: true,
    instrumented: false,
    ...extra,
  }
}

function count(telemetry, event) {
  return telemetry?.counts?.[event] ?? null
}

function breakdown(telemetry, event, prop) {
  return telemetry?.breakdowns?.[event]?.[prop] || {}
}

function mergedBreakdown(telemetry, events, prop) {
  const out = {}
  for (const event of events) {
    for (const [bucket, value] of Object.entries(breakdown(telemetry, event, prop))) {
      addBucket(out, bucket, value)
    }
  }
  return out
}

function sortedBuckets(map, limit = 8) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, count: value }))
}

/* ── Source readers. Each returns plain aggregates only. ─────────────────── */

async function readTelemetry() {
  const db = getDb()
  const snap = await db
    .collectionGroup('analyticsDays')
    .select('counts', 'breakdowns', 'updatedAt')
    .limit(MAX_DOCS)
    .get()

  const counts = {}
  const breakdowns = {}
  const userDays = new Map() // uid → Set(day key); never returned
  let docs = 0

  snap.forEach((doc) => {
    docs += 1
    const data = doc.data() || {}
    const day = /^\d{4}-\d{2}-\d{2}$/.test(doc.id) ? doc.id : null
    // The parent of `users/{uid}/analyticsDays` is the user document. The UID
    // is used only to derive distinct-user counts below, never returned.
    const uid = doc.ref?.parent?.parent?.id
    if (uid && day) {
      if (!userDays.has(uid)) userDays.set(uid, new Set())
      userDays.get(uid).add(day)
    }

    for (const [event, value] of Object.entries(data.counts || {})) {
      addCount(counts, safeBucket(event), numeric(value))
    }
    for (const [event, props] of Object.entries(data.breakdowns || {})) {
      const eventKey = safeBucket(event)
      if (!eventKey || !props || typeof props !== 'object') continue
      for (const prop of SAFE_PROPS) {
        const buckets = props[prop]
        if (!buckets || typeof buckets !== 'object') continue
        for (const [bucket, value] of Object.entries(buckets)) {
          const amount = numeric(value)
          if (!amount) continue
          if (!breakdowns[eventKey]) breakdowns[eventKey] = {}
          if (!breakdowns[eventKey][prop]) breakdowns[eventKey][prop] = {}
          addBucket(breakdowns[eventKey][prop], bucket, amount)
        }
      }
    }
  })

  return { counts, breakdowns, userDays, docs }
}

async function readAuth() {
  const auth = getAuth()
  const records = []
  let pageToken
  do {
    // eslint-disable-next-line no-await-in-loop
    const page = await auth.listUsers(1000, pageToken)
    records.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken && records.length < MAX_DOCS)

  const uids = new Set()
  const signupsByDay = {}
  const now = Date.now()
  let new7d = 0
  let new24h = 0
  for (const record of records) {
    uids.add(record.uid)
    const createdMs = Date.parse(record.metadata?.creationTime || '')
    if (!Number.isFinite(createdMs)) continue
    const day = dateKeyFromMs(createdMs)
    if (day) signupsByDay[day] = (signupsByDay[day] || 0) + 1
    if (now - createdMs < 7 * DAY_MS) new7d += 1
    if (now - createdMs < DAY_MS) new24h += 1
  }

  return { total: records.length, new7d, new24h, signupsByDay, records: records.map((r) => ({ uid: r.uid, createdMs: Date.parse(r.metadata?.creationTime || '') })), uids }
}

async function readWorkouts() {
  const db = getDb()
  const snap = await db
    .collectionGroup('workouts')
    .select('name', 'title', 'workout_title', 'duration_seconds')
    .limit(MAX_DOCS)
    .get()

  const titles = {}
  let durationSum = 0
  let durationCount = 0
  snap.forEach((doc) => {
    const data = doc.data() || {}
    const title = safeTitle(data.workout_title || data.title || data.name)
    if (title) titles[title] = (titles[title] || 0) + 1
    const seconds = numeric(data.duration_seconds, { max: 24 * 3600 })
    if (seconds !== null && seconds > 0) {
      durationSum += seconds
      durationCount += 1
    }
  })

  return {
    docs: snap.size,
    avgDurationSeconds: durationCount ? round(durationSum / durationCount, 0) : null,
    top: sortedBuckets(titles, 10).map((item) => ({ name: item.label, count: item.count })),
  }
}

async function readRuns() {
  const db = getDb()
  const snap = await db
    .collectionGroup('runs')
    .select('distance', 'elapsed', 'duration_seconds', 'pace', 'distance_unit')
    .limit(MAX_DOCS)
    .get()

  let distanceSum = 0
  let distanceCount = 0
  let durationSum = 0
  let durationCount = 0
  let paceSum = 0
  let paceCount = 0

  snap.forEach((doc) => {
    const data = doc.data() || {}
    const meters = numeric(data.distance, { max: 1_000_000 })
    const seconds = numeric(data.elapsed ?? data.duration_seconds, { max: 24 * 3600 })
    if (meters !== null && meters > 0) {
      distanceSum += meters
      distanceCount += 1
    }
    if (seconds !== null && seconds > 0) {
      durationSum += seconds
      durationCount += 1
    }
    // `pace` is stored as minutes per kilometre. Derive it when absent.
    const storedPace = numeric(data.pace, { max: 60 })
    if (storedPace !== null && storedPace > 0) {
      paceSum += storedPace
      paceCount += 1
    } else if (meters > 0 && seconds > 0) {
      const derived = seconds / 60 / (meters / 1000)
      if (derived > 0 && derived < 60) {
        paceSum += derived
        paceCount += 1
      }
    }
  })

  return {
    docs: snap.size,
    avgDistanceMeters: distanceCount ? round(distanceSum / distanceCount, 0) : null,
    avgDurationSeconds: durationCount ? round(durationSum / durationCount, 0) : null,
    avgPaceMinPerKm: paceCount ? round(paceSum / paceCount, 2) : null,
  }
}

async function readEntries() {
  const db = getDb()
  // Food entries can hold raw food names; only source/loggedAt are projected.
  const snap = await db.collectionGroup('entries').select('source', 'loggedAt').limit(MAX_DOCS).get()
  const sources = {}
  const days = new Set()
  snap.forEach((doc) => {
    const data = doc.data() || {}
    addBucket(sources, data.source)
    const stamp = data.loggedAt?.toDate ? data.loggedAt.toDate() : data.loggedAt
    const ms = stamp instanceof Date ? stamp.getTime() : typeof stamp === 'number' ? stamp : Date.parse(stamp || '')
    if (Number.isFinite(ms)) {
      const day = dateKeyFromMs(ms)
      if (day) days.add(day)
    }
  })
  return { docs: snap.size, sources, activeDays: days.size }
}

async function countHealthLogs() {
  const db = getDb()
  const snap = await db.collectionGroup('healthLogs').count().get()
  return snap.data().count
}

/* ── Section builders ───────────────────────────────────────────────────── */

function buildUttarAi(telemetry) {
  const section = baseSection({
    requests: count(telemetry, 'ai_request'),
    successes: count(telemetry, 'ai_request_success'),
    failures: count(telemetry, 'ai_request_failure'),
    rateLimits: count(telemetry, 'ai_rate_limited'),
    limitReached: count(telemetry, 'ai_limit_reached'),
    successRate: null,
    estimatedTokens: null,
    estimatedCostUsd: null,
    tokenRatePerMillion: TOKEN_RATE,
    modeTokens: {},
    upgradeViews: count(telemetry, 'ai_upgrade_viewed'),
    checkoutStarts: count(telemetry, 'ai_checkout_started'),
    planGrants: count(telemetry, 'ai_plan_granted'),
    billingNote: BILLING_NOTE,
  })

  const requests = section.requests
  const successes = section.successes
  if (requests !== null && requests > 0 && successes !== null) {
    section.successRate = round((successes / requests) * 100, 1)
  }

  const modes = mergedBreakdown(telemetry, ['ai_request', 'ai_request_success', 'ai_request_failure'], 'mode')
  const modeKeys = Object.keys(modes)
  if (modeKeys.length) {
    const tokens = {}
    let total = 0
    for (const [mode, requestsInMode] of Object.entries(modes)) {
      const perRequest = MODE_TOKENS[mode] ?? MODE_TOKENS.other
      const modeTotal = requestsInMode * perRequest
      tokens[mode] = modeTotal
      total += modeTotal
    }
    section.modeTokens = tokens
    section.estimatedTokens = total
    section.estimatedCostUsd = round((total / 1_000_000) * TOKEN_RATE, 6)
  } else if (requests !== null && requests > 0) {
    // No mode buckets instrumented yet: apply the conservative chat bucket to
    // every request and say so in the UI hint.
    const total = requests * MODE_TOKENS.other
    section.modeTokens = { other: total }
    section.estimatedTokens = total
    section.estimatedCostUsd = round((total / 1_000_000) * TOKEN_RATE, 6)
  }
  section.instrumented = Boolean(telemetry?.docs)
  return section
}

function buildEngagement(telemetry, workouts) {
  const section = baseSection({
    workoutsStarted: count(telemetry, 'workout_started'),
    workoutsCompleted: count(telemetry, 'workout_completed'),
    completionRate: null,
    dropOffs: count(telemetry, 'workout_drop_off'),
    avgWorkoutDurationSeconds: workouts?.avgDurationSeconds ?? null,
    workoutDocuments: workouts?.docs ?? null,
    topWorkouts: workouts?.top || [],
    customCreated: count(telemetry, 'custom_workout_saved'),
    customShared: count(telemetry, 'custom_workout_shared'),
    customImported: count(telemetry, 'custom_workout_imported'),
    prsLogged: count(telemetry, 'pr_saved'),
    dropOffReasons: sortedBuckets(breakdown(telemetry, 'workout_drop_off', 'reason')),
  })
  if (section.workoutsStarted > 0 && section.workoutsCompleted !== null) {
    section.completionRate = round((section.workoutsCompleted / section.workoutsStarted) * 100, 1)
  }
  section.instrumented = Boolean(telemetry?.docs || workouts?.docs)
  return section
}

function buildRetention(telemetry, auth) {
  const section = baseSection({
    dau: null,
    wau: null,
    mau: null,
    signups: auth?.total ?? null,
    signups7d: auth?.new7d ?? null,
    signups24h: auth?.new24h ?? null,
    returningUsers: null,
    streakBuckets: [
      { label: '1', count: 0 },
      { label: '2-3', count: 0 },
      { label: '4-6', count: 0 },
      { label: '7+', count: 0 },
    ],
    zeroActivityUsers: null,
    zeroActivityAfterSignup7d: null,
    activeUsersSeries: [],
  })

  if (telemetry) {
    const now = Date.now()
    const today = dateKeyFromMs(now)
    const week = dateKeyFromMs(now - 7 * DAY_MS)
    const month = dateKeyFromMs(now - 30 * DAY_MS)
    const userDays = [...telemetry.userDays.values()]

    section.dau = userDays.filter((days) => days.has(today)).length
    section.wau = userDays.filter((days) => [...days].some((day) => day >= week)).length
    section.mau = userDays.filter((days) => [...days].some((day) => day >= month)).length

    let returning = 0
    const streak = { one: 0, twoThree: 0, fourSix: 0, sevenPlus: 0 }
    for (const days of userDays) {
      if (days.size > 1) returning += 1
      if (days.size <= 1) streak.one += 1
      else if (days.size <= 3) streak.twoThree += 1
      else if (days.size <= 6) streak.fourSix += 1
      else streak.sevenPlus += 1
    }
    section.returningUsers = returning
    section.streakBuckets = [
      { label: '1', count: streak.one },
      { label: '2-3', count: streak.twoThree },
      { label: '4-6', count: streak.fourSix },
      { label: '7+', count: streak.sevenPlus },
    ]

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const series = []
    for (let i = 13; i >= 0; i -= 1) {
      const dayStart = new Date(start)
      dayStart.setDate(dayStart.getDate() - i)
      const key = dateKeyFromMs(dayStart.getTime())
      // An ISO day-start label, not the raw analyticsDays document key.
      series.push({ date: `${key}T00:00:00.000Z`, count: userDays.filter((days) => days.has(key)).length })
    }
    section.activeUsersSeries = series
  }

  if (auth && telemetry) {
    const activeUids = telemetry.userDays
    const inactive = auth.records.filter((record) => !activeUids.has(record.uid))
    section.zeroActivityUsers = inactive.length
    section.zeroActivityAfterSignup7d = inactive.filter(
      (record) => Number.isFinite(record.createdMs) && Date.now() - record.createdMs > 7 * DAY_MS,
    ).length
  }

  section.instrumented = Boolean(telemetry?.docs || auth?.total)
  return section
}

function buildRunsImports(telemetry, runs) {
  const section = baseSection({
    runsStarted: count(telemetry, 'run_started'),
    runsCompleted: count(telemetry, 'run_completed'),
    runsCount: runs?.docs ?? null,
    avgDistanceMeters: runs?.avgDistanceMeters ?? null,
    avgDurationSeconds: runs?.avgDurationSeconds ?? null,
    avgPaceMinPerKm: runs?.avgPaceMinPerKm ?? null,
    importsSaved: count(telemetry, 'run_import_saved'),
    importsFailed: count(telemetry, 'run_import_failed'),
    importsDuplicate: count(telemetry, 'run_import_duplicate'),
    importSources: sortedBuckets(
      mergedBreakdown(telemetry, ['run_import_saved', 'run_import_failed', 'run_import_duplicate'], 'source'),
      10,
    ),
  })
  section.instrumented = Boolean(telemetry?.docs || runs?.docs)
  return section
}

function buildNutritionHealth(telemetry, entries, healthLogDocuments) {
  const section = baseSection({
    foodLogs: count(telemetry, 'food_logged'),
    foodLogsPerActiveDay: null,
    foodLogDocuments: entries?.docs ?? null,
    foodSources: sortedBuckets(
      mergedBreakdown(telemetry, ['food_logged'], 'source'),
      10,
    ),
    correctionsSaved: count(telemetry, 'food_correction_saved'),
    correctionsReset: count(telemetry, 'food_correction_reset'),
    healthPrompted: count(telemetry, 'health_permission_prompted'),
    healthGranted: count(telemetry, 'health_permission_granted'),
    healthDenied: count(telemetry, 'health_permission_denied'),
    healthLogDocuments: healthLogDocuments ?? null,
    healthBanner: 'Health data is shown only as counts. Raw health values are never displayed here.',
  })
  if (section.foodLogs !== null && telemetry?.docs) {
    section.foodLogsPerActiveDay = round(section.foodLogs / telemetry.docs, 1)
  }
  section.instrumented = Boolean(telemetry?.docs || entries?.docs || healthLogDocuments)
  return section
}

function environmentBreakdown(telemetry, prop) {
  const fromAppOpen = breakdown(telemetry, 'app_opened', prop)
  if (Object.keys(fromAppOpen).length) return { buckets: sortedBuckets(fromAppOpen, 10), source: 'app opens' }
  const combined = {}
  for (const props of Object.values(telemetry?.breakdowns || {})) {
    for (const [bucket, value] of Object.entries(props?.[prop] || {})) addBucket(combined, bucket, value)
  }
  return { buckets: sortedBuckets(combined, 10), source: 'all telemetry events' }
}

function buildReliability(telemetry) {
  const platforms = environmentBreakdown(telemetry, 'platform')
  const browsers = environmentBreakdown(telemetry, 'browser')
  const os = environmentBreakdown(telemetry, 'os')
  const appVersions = environmentBreakdown(telemetry, 'appVersion')

  const requests = count(telemetry, 'ai_request')
  const failures = count(telemetry, 'ai_request_failure')
  const section = baseSection({
    offlineQueuedWrites: count(telemetry, 'workout_log_queued'),
    writeFailures: count(telemetry, 'firestore_write_failed'),
    writeFailureCollections: sortedBuckets(breakdown(telemetry, 'firestore_write_failed', 'collection')),
    exportRequested: count(telemetry, 'export_requested'),
    exportSucceeded: count(telemetry, 'export_succeeded'),
    exportFailed: count(telemetry, 'export_failed'),
    deletionRequests: count(telemetry, 'deletion_requested'),
    supportContacts: count(telemetry, 'support_contacted'),
    supportDestinations: sortedBuckets(breakdown(telemetry, 'support_contacted', 'destination')),
    communityReports: count(telemetry, 'community_report_submitted'),
    reportReasons: sortedBuckets(breakdown(telemetry, 'community_report_submitted', 'reason')),
    aiProviderErrorRate: null,
    pwaInstallPrompted: count(telemetry, 'pwa_install_prompted'),
    pwaInstallAccepted: count(telemetry, 'pwa_install_accepted'),
    pwaInstallDismissed: count(telemetry, 'pwa_install_dismissed'),
    pwaInstalled: count(telemetry, 'pwa_app_installed'),
    platforms: platforms.buckets,
    browsers: browsers.buckets,
    os: os.buckets,
    appVersions: appVersions.buckets,
    environmentSource: platforms.source,
  })
  if (requests > 0 && failures !== null) {
    section.aiProviderErrorRate = round((failures / requests) * 100, 1)
  }
  section.instrumented = Boolean(telemetry?.docs)
  return section
}

/** Wrap a whole section so an unexpected error still cannot break the page. */
function guard(name, warnings, fallback, fn) {
  try {
    return fn()
  } catch (error) {
    console.error(`[analytics] ${name} aggregation failed:`, error?.message || error)
    warnings.push({ section: name, message: 'Aggregation failed for this section.' })
    return fallback
  }
}

/* ── Entry point ────────────────────────────────────────────────────────── */

export async function getAnalytics() {
  const warnings = []
  const [telemetry, auth, workouts, runs, entries, healthLogDocuments] = await Promise.all([
    safeRead('analyticsDays', warnings, readTelemetry),
    safeRead('Auth users', warnings, readAuth),
    safeRead('workouts', warnings, readWorkouts),
    safeRead('runs', warnings, readRuns),
    safeRead('entries', warnings, readEntries),
    safeRead('healthLogs', warnings, countHealthLogs),
  ])

  return {
    generatedAt: new Date().toISOString(),
    projectId: getProjectId(),
    sample: false,
    limits: { docsPerCollection: MAX_DOCS },
    scanned: {
      analyticsDays: telemetry?.docs ?? null,
      workouts: workouts?.docs ?? null,
      runs: runs?.docs ?? null,
      entries: entries?.docs ?? null,
      authUsers: auth?.total ?? null,
    },
    sections: {
      uttarAi: guard('Uttar AI', warnings, baseSection(), () => buildUttarAi(telemetry)),
      engagement: guard('Engagement', warnings, baseSection(), () => buildEngagement(telemetry, workouts)),
      retention: guard('Retention', warnings, baseSection(), () => buildRetention(telemetry, auth)),
      runsImports: guard('Runs & imports', warnings, baseSection(), () => buildRunsImports(telemetry, runs)),
      nutritionHealth: guard('Nutrition & health', warnings, baseSection(), () => buildNutritionHealth(telemetry, entries, healthLogDocuments)),
      reliability: guard('Reliability', warnings, baseSection(), () => buildReliability(telemetry)),
    },
    warnings,
  }
}
