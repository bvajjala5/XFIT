// In-memory sample data. It is used automatically when the app runs in a plain
// browser (`npm run preview:web`) instead of inside Electron, so the UI can be
// developed and previewed without Firebase credentials. Inside Electron the
// real IPC bridge (window.admin) is always used instead of this file.

const DAY = 24 * 60 * 60 * 1000

function daysAgo(days, hour = 9, minute = 12) {
  const date = new Date(Date.now() - days * DAY)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Synthetic accounts only. Names and email addresses are deliberately generic
// so browser previews cannot be mistaken for real user data.
const SEED = [
  ['u_1a2b3c4d', 'Sample User 01', 'sample01@demo.invalid', 'build_muscle', 'intermediate', 'admin', false, 412, 0.2, true],
  ['u_2b3c4d5e', 'Sample User 02', 'sample02@demo.invalid', 'lose_weight', 'beginner', 'user', false, 388, 1.4, true],
  ['u_3c4d5e6f', 'Sample User 03', 'sample03@demo.invalid', 'improve_endurance', 'advanced', 'user', false, 361, 0.6, true],
  ['u_4d5e6f70', 'Sample User 04', 'sample04@demo.invalid', 'build_muscle', 'intermediate', 'user', false, 344, 3.1, true],
  ['u_5e6f7081', 'Sample User 05', 'sample05@demo.invalid', 'flexibility', 'beginner', 'user', true, 330, 21.5, true],
  ['u_6f708192', 'Sample User 06', 'sample06@demo.invalid', 'lose_weight', 'intermediate', 'user', false, 318, 0.9, true],
  ['u_708192a3', 'Sample User 07', 'sample07@demo.invalid', 'improve_endurance', 'advanced', 'user', false, 305, 2.2, true],
  ['u_8192a3b4', 'Sample User 08', 'sample08@demo.invalid', 'build_muscle', 'beginner', 'user', false, 289, 5.7, false],
  ['u_92a3b4c5', 'Sample User 09', 'sample09@demo.invalid', 'lose_weight', 'intermediate', 'user', false, 274, 0.1, true],
  ['u_a3b4c5d6', 'Sample User 10', 'sample10@demo.invalid', 'flexibility', 'beginner', 'user', true, 260, 44.2, true],
  ['u_b4c5d6e7', 'Sample User 11', 'sample11@demo.invalid', 'improve_endurance', 'advanced', 'user', false, 246, 1.1, true],
  ['u_c5d6e7f8', 'Sample User 12', 'sample12@demo.invalid', 'build_muscle', 'intermediate', 'user', false, 231, 6.8, true],
  ['u_d6e7f809', 'Sample User 13', 'sample13@demo.invalid', 'lose_weight', 'beginner', 'user', false, 217, 0.4, true],
  ['u_e7f80912', 'Sample User 14', 'sample14@demo.invalid', 'build_muscle', 'advanced', 'user', false, 203, 2.9, true],
  ['u_f8091223', 'Sample User 15', 'sample15@demo.invalid', 'improve_endurance', 'intermediate', 'user', false, 188, 8.3, true],
  ['u_09122334', 'Sample User 16', 'sample16@demo.invalid', 'lose_weight', 'beginner', 'user', false, 174, 1.9, false],
  ['u_12233445', 'Sample User 17', 'sample17@demo.invalid', 'flexibility', 'intermediate', 'user', false, 160, 4.5, true],
  ['u_23344556', 'Sample User 18', 'sample18@demo.invalid', 'build_muscle', 'beginner', 'user', true, 147, 30.1, true],
  ['u_34455667', 'Sample User 19', 'sample19@demo.invalid', 'improve_endurance', 'advanced', 'user', false, 133, 0.7, true],
  ['u_45566778', 'Sample User 20', 'sample20@demo.invalid', 'lose_weight', 'intermediate', 'user', false, 121, 3.4, true],
  ['u_56677889', 'Sample User 21', 'sample21@demo.invalid', 'build_muscle', 'beginner', 'user', false, 108, 1.2, true],
  ['u_6778899a', 'Sample User 22', 'sample22@demo.invalid', 'flexibility', 'intermediate', 'user', false, 96, 9.6, true],
  ['u_78899aab', 'Sample User 23', 'sample23@demo.invalid', 'improve_endurance', 'advanced', 'admin', false, 84, 0.3, true],
  ['u_899aabbc', 'Sample User 24', 'sample24@demo.invalid', 'build_muscle', 'beginner', 'user', false, 71, 12.8, false],
  ['u_9aabbccd', 'Sample User 25', 'sample25@demo.invalid', 'lose_weight', 'intermediate', 'user', false, 59, 2.6, true],
  ['u_abbccdde', 'Sample User 26', 'sample26@demo.invalid', 'improve_endurance', 'beginner', 'user', false, 44, 5.1, true],
  ['u_bccddeef', 'Sample User 27', 'sample27@demo.invalid', 'build_muscle', 'advanced', 'user', true, 31, 27.4, true],
  ['u_cddeeff0', 'Sample User 28', 'sample28@demo.invalid', 'flexibility', 'intermediate', 'user', false, 19, 0.5, true],
  ['u_deeff001', 'Sample User 29', 'sample29@demo.invalid', 'lose_weight', 'beginner', 'user', false, 9, 1.7, true],
  ['u_eff00112', 'Sample User 30', 'sample30@demo.invalid', 'build_muscle', 'intermediate', 'user', false, 4, 0.8, false],
]

const GOALS = ['build_muscle', 'lose_weight', 'improve_endurance', 'flexibility']

let users = SEED.map(
  ([uid, name, email, goal, level, role, disabled, createdDays, lastSeenDays, onboarded], index) => ({
    uid,
    email,
    displayName: name,
    fullName: name,
    photoURL: '',
    profilePicture: '',
    phoneNumber: '',
    emailVerified: true,
    disabled,
    provider: index % 5 === 0 ? 'google.com' : 'google.com',
    role,
    fitnessGoal: goal,
    experienceLevel: level,
    distanceUnit: 'miles',
    onboardingComplete: onboarded,
    hasProfile: onboarded || index % 3 !== 0,
    createdAt: daysAgo(createdDays, 8 + (index % 10)),
    lastSignInAt: daysAgo(lastSeenDays, 7 + (index % 12), 10 + (index % 40)),
  }),
)

function subcollectionCounts(user) {
  const seed = user.uid.charCodeAt(3) + user.uid.length
  return {
    workouts: 20 + (seed % 140),
    customWorkouts: seed % 9,
    healthLogs: 5 + (seed % 60),
    runs: seed % 22,
    weightLogs: seed % 30,
    checkins: seed % 45,
    followers: seed % 15,
    customFoods: seed % 12,
    analyticsDays: 3 + (seed % 25),
  }
}

function recentWorkouts(user) {
  const seed = user.uid.charCodeAt(4) + user.uid.length
  const names = ['Upper Body Strength', 'Morning HIIT', '5K Run', 'Leg Day', 'Core & Mobility', 'Push Day', 'Full Body Circuit']
  return Array.from({ length: 5 }, (_, i) => {
    const minutes = 18 + ((seed + i * 7) % 52)
    return {
      id: `${user.uid}_w${i}`,
      name: names[(seed + i) % names.length],
      completedAt: daysAgo(i * 2 + 1, 6 + i, 20),
      duration_seconds: minutes * 60,
      calories_burned: minutes * (6 + (i % 4)),
    }
  })
}

// Sample-only aggregate analytics. The shape mirrors the real `admin:analytics`
// IPC response exactly, but every number below is invented for browser previews.
function analytics() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activeUsersSeries = []
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    activeUsersSeries.push({
      date: day.toISOString(),
      count: 6 + ((i * 3) % 11),
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    projectId: 'xfit-723dd',
    sample: true,
    limits: { docsPerCollection: 20000 },
    scanned: {
      analyticsDays: 412,
      workouts: 1186,
      runs: 274,
      entries: 903,
      authUsers: users.length,
    },
    warnings: [],
    sections: {
      uttarAi: {
        available: true,
        instrumented: true,
        requests: 1842,
        successes: 1607,
        failures: 235,
        rateLimits: 58,
        limitReached: 96,
        successRate: 87.2,
        estimatedTokens: 2_438_400,
        estimatedCostUsd: 0.18288,
        tokenRatePerMillion: 0.075,
        modeTokens: { chat: 1_238_400, workout: 1_080_000, formcheck: 96_000, other: 24_000 },
        upgradeViews: 314,
        checkoutStarts: 41,
        planGrants: 29,
        billingNote:
          'Exact billing and quota live in Stripe/Gemini. KV-backed server entitlements are not readable by this desktop app.',
      },
      engagement: {
        available: true,
        instrumented: true,
        workoutsStarted: 4920,
        workoutsCompleted: 3716,
        completionRate: 75.5,
        dropOffs: 412,
        avgWorkoutDurationSeconds: 2460,
        workoutDocuments: 1186,
        topWorkouts: [
          { name: 'Upper Body Strength', count: 214 },
          { name: 'Morning HIIT', count: 186 },
          { name: 'Leg Day', count: 153 },
          { name: 'Core & Mobility', count: 121 },
          { name: 'Push Day', count: 98 },
          { name: 'Full Body Circuit', count: 76 },
        ],
        customCreated: 187,
        customShared: 42,
        customImported: 63,
        prsLogged: 329,
        dropOffReasons: [
          { label: 'time', count: 184 },
          { label: 'interrupted', count: 131 },
          { label: 'equipment', count: 97 },
        ],
      },
      retention: {
        available: true,
        instrumented: true,
        dau: 17,
        wau: 24,
        mau: 29,
        signups: users.length,
        signups7d: 6,
        signups24h: 1,
        returningUsers: 22,
        streakBuckets: [
          { label: '1', count: 8 },
          { label: '2-3', count: 7 },
          { label: '4-6', count: 6 },
          { label: '7+', count: 9 },
        ],
        zeroActivityUsers: 3,
        zeroActivityAfterSignup7d: 2,
        activeUsersSeries,
      },
      runsImports: {
        available: true,
        instrumented: true,
        runsStarted: 612,
        runsCompleted: 548,
        runsCount: 274,
        avgDistanceMeters: 5210,
        avgDurationSeconds: 1810,
        avgPaceMinPerKm: 5.78,
        importsSaved: 163,
        importsFailed: 21,
        importsDuplicate: 34,
        importSources: [
          { label: 'gpx', count: 74 },
          { label: 'csv', count: 51 },
          { label: 'tcx', count: 23 },
          { label: 'strava', count: 15 },
        ],
      },
      nutritionHealth: {
        available: true,
        instrumented: true,
        foodLogs: 3184,
        foodLogsPerActiveDay: 7.7,
        foodLogDocuments: 903,
        foodSources: [
          { label: 'usda', count: 1421 },
          { label: 'online', count: 886 },
          { label: 'meal', count: 512 },
          { label: 'barcode', count: 365 },
        ],
        correctionsSaved: 74,
        correctionsReset: 19,
        healthPrompted: 108,
        healthGranted: 71,
        healthDenied: 37,
        healthLogDocuments: 624,
        healthBanner: 'Health data is shown only as counts. Raw health values are never displayed here.',
      },
      reliability: {
        available: true,
        instrumented: true,
        offlineQueuedWrites: 146,
        writeFailures: 23,
        writeFailureCollections: [
          { label: 'workouts', count: 12 },
          { label: 'foodlogs', count: 7 },
          { label: 'runs', count: 4 },
        ],
        exportRequested: 38,
        exportSucceeded: 31,
        exportFailed: 5,
        deletionRequests: 4,
        supportContacts: 27,
        supportDestinations: [
          { label: 'email', count: 19 },
          { label: 'web', count: 8 },
        ],
        communityReports: 11,
        reportReasons: [
          { label: 'spam', count: 6 },
          { label: 'abuse', count: 3 },
          { label: 'other', count: 2 },
        ],
        aiProviderErrorRate: 12.8,
        pwaInstallPrompted: 214,
        pwaInstallAccepted: 46,
        pwaInstallDismissed: 138,
        pwaInstalled: 52,
        platforms: [
          { label: 'web', count: 1420 },
          { label: 'android', count: 422 },
        ],
        browsers: [
          { label: 'chrome', count: 918 },
          { label: 'safari', count: 372 },
          { label: 'edge', count: 96 },
          { label: 'webview', count: 422 },
        ],
        os: [
          { label: 'android', count: 422 },
          { label: 'ios', count: 486 },
          { label: 'macos', count: 604 },
          { label: 'windows', count: 264 },
        ],
        appVersions: [
          { label: 'web', count: 1420 },
          { label: '1-4-2', count: 422 },
        ],
        environmentSource: 'app opens',
      },
    },
  }
}

function overview() {
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const series = []
  for (let i = 13; i >= 0; i -= 1) {
    const dayStart = new Date(startOfToday)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    series.push({
      date: dayStart.toISOString().slice(0, 10),
      count: users.filter(
        (u) =>
          Date.parse(u.createdAt) >= dayStart.getTime() &&
          Date.parse(u.createdAt) < dayEnd.getTime(),
      ).length,
    })
  }
  const activity = []
  for (const user of users) {
    activity.push({ type: 'signup', uid: user.uid, email: user.email, name: user.fullName, at: user.createdAt })
    activity.push({ type: 'signin', uid: user.uid, email: user.email, name: user.fullName, at: user.lastSignInAt })
  }
  activity.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return {
    projectId: 'xfit-723dd',
    stats: {
      total: users.length,
      active: users.filter((u) => !u.disabled).length,
      admins: users.filter((u) => u.role === 'admin').length,
      suspended: users.filter((u) => u.disabled).length,
      new7d: users.filter((u) => now - Date.parse(u.createdAt) < 7 * DAY).length,
      new24h: users.filter((u) => now - Date.parse(u.createdAt) < DAY).length,
      onboarded: users.filter((u) => u.onboardingComplete).length,
    },
    series,
    activity: activity.slice(0, 30),
    generatedAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
  }
}

function listUsers(params = {}) {
  const { search = '', role = 'all', status = 'all', page = 1, pageSize = 25 } = params
  const term = String(search).trim().toLowerCase()
  let filtered = users
  if (term) {
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        u.uid.toLowerCase().includes(term) ||
        u.fullName.toLowerCase().includes(term),
    )
  }
  if (role === 'admin' || role === 'user') filtered = filtered.filter((u) => u.role === role)
  if (status === 'active') filtered = filtered.filter((u) => !u.disabled)
  else if (status === 'suspended') filtered = filtered.filter((u) => u.disabled)

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pages)
  const start = (current - 1) * pageSize
  return {
    users: filtered.slice(start, start + pageSize),
    total,
    page: current,
    pageSize,
    pages,
    generatedAt: new Date().toISOString(),
  }
}

function getUser(uid) {
  const user = users.find((u) => u.uid === uid)
  if (!user) throw new Error('User not found')
  const seed = uid.charCodeAt(3)
  return {
    ...user,
    profile: {
      email: user.email,
      full_name: user.fullName,
      profile_picture: '',
      fitness_goal: user.fitnessGoal,
      experience_level: user.experienceLevel,
      preferred_types: ['strength', 'cardio'].slice(0, (seed % 2) + 1),
      distance_unit: user.distanceUnit,
      goals: { weekly_workouts: 4, weekly_minutes: 180 },
      journal_entries: [],
      onboarding_complete: user.onboardingComplete,
      createdAt: user.createdAt,
    },
    counts: subcollectionCounts(user),
    recentWorkouts: recentWorkouts(user),
  }
}

function setRole(uid, role) {
  const user = users.find((u) => u.uid === uid)
  if (!user) throw new Error('User not found')
  user.role = role === 'admin' ? 'admin' : 'user'
  return { uid, role: user.role, email: user.email }
}

function setSuspended(uid, suspended) {
  const user = users.find((u) => u.uid === uid)
  if (!user) throw new Error('User not found')
  user.disabled = Boolean(suspended)
  return { uid, suspended: user.disabled, email: user.email }
}

// Mirror the shape of the Electron IPC bridge: each call resolves to
// `{ ok, data }` or `{ ok, error }`.
export const mockBridge = {
  isDesktop: false,
  async config() {
    return { ok: true, data: { configured: true, projectId: 'xfit-723dd', envPath: '', mock: true } }
  },
  async overview() {
    return { ok: true, data: overview() }
  },
  async analytics() {
    return { ok: true, data: analytics() }
  },
  async listUsers(params) {
    return { ok: true, data: listUsers(params) }
  },
  async getUser(uid) {
    try {
      return { ok: true, data: getUser(uid) }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  },
  async setRole(uid, role) {
    try {
      return { ok: true, data: setRole(uid, role) }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  },
  async setSuspended(uid, suspended) {
    try {
      return { ok: true, data: setSuspended(uid, suspended) }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  },
}

export const MOCK_GOALS = GOALS
