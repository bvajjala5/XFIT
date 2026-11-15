import { getAuth, getDb, getProjectId, isConfigured, ENV_PATH } from './firebase.js'

// Firebase Auth listing is the slow part, so we cache the merged user list for
// a short window and reuse it for the dashboard, search, and pagination.
const CACHE_TTL_MS = 30_000
const MAX_USERS = 20_000
const DAY_MS = 24 * 60 * 60 * 1000

// Subcollections shown as counters on a user's detail page.
const USER_SUBCOLLECTIONS = [
  'workouts',
  'customWorkouts',
  'healthLogs',
  'runs',
  'weightLogs',
  'checkins',
  'followers',
  'customFoods',
]

let cache = { at: 0, users: null }

function invalidate() {
  cache = { at: 0, users: null }
}

function toISO(value) {
  if (!value) return null
  const ms = typeof value === 'number' ? value : Date.parse(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

/** Firestore Timestamps / Dates are not structured-cloneable over IPC. */
function serialize(value) {
  if (value == null) return value
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = serialize(item)
    return out
  }
  return value
}

async function listAllAuthUsers() {
  const auth = getAuth()
  const users = []
  let pageToken
  do {
    // eslint-disable-next-line no-await-in-loop
    const page = await auth.listUsers(1000, pageToken)
    users.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken && users.length < MAX_USERS)
  return users
}

function shapeAuthUser(record) {
  const claims = record.customClaims || {}
  const provider = record.providerData?.[0]?.providerId || 'password'
  return {
    uid: record.uid,
    email: record.email || '',
    displayName: record.displayName || '',
    photoURL: record.photoURL || '',
    phoneNumber: record.phoneNumber || '',
    emailVerified: Boolean(record.emailVerified),
    disabled: Boolean(record.disabled),
    provider,
    role: claims.admin === true ? 'admin' : 'user',
    createdAt: toISO(record.metadata?.creationTime),
    lastSignInAt: toISO(record.metadata?.lastSignInTime),
  }
}

/** Read every `users/{uid}` profile doc into a Map (id → data). */
async function fetchProfiles() {
  const db = getDb()
  const map = new Map()
  let cursor = null
  for (;;) {
    let query = db
      .collection('users')
      .select(
        'full_name',
        'profile_picture',
        'fitness_goal',
        'experience_level',
        'distance_unit',
        'onboarding_complete',
        'createdAt',
      )
      .orderBy('__name__')
      .limit(300)
    if (cursor) query = query.startAfter(cursor)
    // eslint-disable-next-line no-await-in-loop
    const snap = await query.get()
    if (snap.empty) break
    snap.forEach((doc) => map.set(doc.id, doc.data()))
    cursor = snap.docs[snap.docs.length - 1]
    if (snap.size < 300) break
  }
  return map
}

async function getMergedUsers(force = false) {
  if (!force && cache.users && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.users
  }

  const [authUsers, profiles] = await Promise.all([
    listAllAuthUsers(),
    fetchProfiles().catch((error) => {
      console.error('[data] profile fetch failed (continuing with Auth data):', error.message)
      return new Map()
    }),
  ])

  const merged = authUsers.map((record) => {
    const base = shapeAuthUser(record)
    const profile = profiles.get(record.uid) || {}
    return {
      ...base,
      fullName: profile.full_name || base.displayName || '',
      profilePicture: profile.profile_picture || base.photoURL || '',
      fitnessGoal: profile.fitness_goal || '',
      experienceLevel: profile.experience_level || '',
      distanceUnit: profile.distance_unit || '',
      onboardingComplete: profile.onboarding_complete === true,
      hasProfile: profiles.has(record.uid),
    }
  })

  merged.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
  cache = { at: Date.now(), users: merged }
  return merged
}

export function getConfig() {
  return {
    configured: isConfigured(),
    projectId: getProjectId(),
    envPath: ENV_PATH,
  }
}

export async function getOverview() {
  const users = await getMergedUsers()
  const now = Date.now()

  const stats = {
    total: users.length,
    active: users.filter((user) => !user.disabled).length,
    admins: users.filter((user) => user.role === 'admin').length,
    suspended: users.filter((user) => user.disabled).length,
    new7d: users.filter((user) => user.createdAt && now - Date.parse(user.createdAt) < 7 * DAY_MS).length,
    new24h: users.filter((user) => user.createdAt && now - Date.parse(user.createdAt) < DAY_MS).length,
    onboarded: users.filter((user) => user.onboardingComplete).length,
  }

  // New sign-ups per day for the last 14 days.
  const series = []
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  for (let i = 13; i >= 0; i -= 1) {
    const dayStart = new Date(startOfToday)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = users.filter(
      (user) =>
        user.createdAt &&
        Date.parse(user.createdAt) >= dayStart.getTime() &&
        Date.parse(user.createdAt) < dayEnd.getTime(),
    ).length
    series.push({ date: dayStart.toISOString().slice(0, 10), count })
  }

  // A combined "signed up / signed in" feed.
  const activity = []
  for (const user of users) {
    if (user.createdAt) {
      activity.push({ type: 'signup', uid: user.uid, email: user.email, name: user.fullName, at: user.createdAt })
    }
    if (user.lastSignInAt) {
      activity.push({ type: 'signin', uid: user.uid, email: user.email, name: user.fullName, at: user.lastSignInAt })
    }
  }
  activity.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return {
    projectId: getProjectId(),
    stats,
    series,
    activity: activity.slice(0, 30),
    generatedAt: new Date().toISOString(),
    cachedAt: cache.at ? new Date(cache.at).toISOString() : null,
  }
}

export async function listUsers(params = {}) {
  const {
    search = '',
    role = 'all',
    status = 'all',
    page = 1,
    pageSize = 25,
    refresh = false,
  } = params

  const users = await getMergedUsers(refresh)
  const term = String(search).trim().toLowerCase()

  let filtered = users
  if (term) {
    filtered = filtered.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        user.uid.toLowerCase().includes(term) ||
        (user.fullName || '').toLowerCase().includes(term) ||
        (user.displayName || '').toLowerCase().includes(term),
    )
  }
  if (role === 'admin' || role === 'user') {
    filtered = filtered.filter((user) => user.role === role)
  }
  if (status === 'active') filtered = filtered.filter((user) => !user.disabled)
  else if (status === 'suspended') filtered = filtered.filter((user) => user.disabled)

  const total = filtered.length
  const size = Math.min(Math.max(Number(pageSize) || 25, 1), 200)
  const pages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(Number(page) || 1, 1), pages)
  const start = (current - 1) * size

  return {
    users: filtered.slice(start, start + size),
    total,
    page: current,
    pageSize: size,
    pages,
    generatedAt: cache.at ? new Date(cache.at).toISOString() : null,
  }
}

export async function getUser(uid) {
  const auth = getAuth()
  const db = getDb()

  const [record, docSnap] = await Promise.all([auth.getUser(uid), db.doc(`users/${uid}`).get()])
  const base = shapeAuthUser(record)
  const profile = docSnap.exists ? serialize(docSnap.data()) : null

  const counts = {}
  await Promise.all(
    USER_SUBCOLLECTIONS.map(async (name) => {
      try {
        const snap = await db.collection(`users/${uid}/${name}`).count().get()
        counts[name] = snap.data().count
      } catch {
        counts[name] = null
      }
    }),
  )

  let recentWorkouts = []
  try {
    const snap = await db
      .collection(`users/${uid}/workouts`)
      .orderBy('completedAt', 'desc')
      .limit(8)
      .get()
    recentWorkouts = snap.docs.map((doc) => ({ id: doc.id, ...serialize(doc.data()) }))
  } catch {
    recentWorkouts = []
  }

  return { ...base, profile, counts, recentWorkouts }
}

export async function setRole({ uid, role }) {
  if (role !== 'admin' && role !== 'user') {
    throw new Error(`Unknown role: ${role}`)
  }
  const auth = getAuth()
  const record = await auth.getUser(uid)
  const claims = { ...(record.customClaims || {}) }
  if (role === 'admin') claims.admin = true
  else delete claims.admin

  await auth.setCustomUserClaims(uid, claims)
  invalidate()
  return { uid, role, email: record.email || '' }
}

export async function setSuspended({ uid, suspended }) {
  const auth = getAuth()
  const next = Boolean(suspended)
  const record = await auth.updateUser(uid, { disabled: next })
  invalidate()
  return { uid, suspended: next, email: record.email || '' }
}
