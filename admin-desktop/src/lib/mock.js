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

const SEED = [
  ['u_1a2b3c4d', 'Alex Rivera', 'alex.rivera@example.com', 'build_muscle', 'intermediate', 'admin', false, 412, 0.2, true],
  ['u_2b3c4d5e', 'Priya Sharma', 'priya.sharma@example.com', 'lose_weight', 'beginner', 'user', false, 388, 1.4, true],
  ['u_3c4d5e6f', 'Marcus Johnson', 'marcus.johnson@example.com', 'improve_endurance', 'advanced', 'user', false, 361, 0.6, true],
  ['u_4d5e6f70', 'Sofia Rossi', 'sofia.rossi@example.com', 'build_muscle', 'intermediate', 'user', false, 344, 3.1, true],
  ['u_5e6f7081', 'Daniel Kim', 'daniel.kim@example.com', 'flexibility', 'beginner', 'user', true, 330, 21.5, true],
  ['u_6f708192', 'Aisha Patel', 'aisha.patel@example.com', 'lose_weight', 'intermediate', 'user', false, 318, 0.9, true],
  ['u_708192a3', 'Liam O\u2019Connor', 'liam.oconnor@example.com', 'improve_endurance', 'advanced', 'user', false, 305, 2.2, true],
  ['u_8192a3b4', 'Chen Wei', 'chen.wei@example.com', 'build_muscle', 'beginner', 'user', false, 289, 5.7, false],
  ['u_92a3b4c5', 'Fatima Al-Sayed', 'fatima.alsayed@example.com', 'lose_weight', 'intermediate', 'user', false, 274, 0.1, true],
  ['u_a3b4c5d6', 'Noah Williams', 'noah.williams@example.com', 'flexibility', 'beginner', 'user', true, 260, 44.2, true],
  ['u_b4c5d6e7', 'Elena Petrova', 'elena.petrova@example.com', 'improve_endurance', 'advanced', 'user', false, 246, 1.1, true],
  ['u_c5d6e7f8', 'Tomas Novak', 'tomas.novak@example.com', 'build_muscle', 'intermediate', 'user', false, 231, 6.8, true],
  ['u_d6e7f809', 'Grace Mwangi', 'grace.mwangi@example.com', 'lose_weight', 'beginner', 'user', false, 217, 0.4, true],
  ['u_e7f80912', 'Hiro Tanaka', 'hiro.tanaka@example.com', 'build_muscle', 'advanced', 'user', false, 203, 2.9, true],
  ['u_f8091223', 'Isabella Silva', 'isabella.silva@example.com', 'improve_endurance', 'intermediate', 'user', false, 188, 8.3, true],
  ['u_09122334', 'Omar Haddad', 'omar.haddad@example.com', 'lose_weight', 'beginner', 'user', false, 174, 1.9, false],
  ['u_12233445', 'Julia Schmidt', 'julia.schmidt@example.com', 'flexibility', 'intermediate', 'user', false, 160, 4.5, true],
  ['u_23344556', 'Kwame Mensah', 'kwame.mensah@example.com', 'build_muscle', 'beginner', 'user', true, 147, 30.1, true],
  ['u_34455667', 'Nadia Rahman', 'nadia.rahman@example.com', 'improve_endurance', 'advanced', 'user', false, 133, 0.7, true],
  ['u_45566778', 'Ethan Brown', 'ethan.brown@example.com', 'lose_weight', 'intermediate', 'user', false, 121, 3.4, true],
  ['u_56677889', 'Camila Fernandez', 'camila.fernandez@example.com', 'build_muscle', 'beginner', 'user', false, 108, 1.2, true],
  ['u_6778899a', 'Yusuf Demir', 'yusuf.demir@example.com', 'flexibility', 'intermediate', 'user', false, 96, 9.6, true],
  ['u_78899aab', 'Hannah Lee', 'hannah.lee@example.com', 'improve_endurance', 'advanced', 'admin', false, 84, 0.3, true],
  ['u_899aabbc', 'Diego Torres', 'diego.torres@example.com', 'build_muscle', 'beginner', 'user', false, 71, 12.8, false],
  ['u_9aabbccd', 'Amara Okafor', 'amara.okafor@example.com', 'lose_weight', 'intermediate', 'user', false, 59, 2.6, true],
  ['u_abbccdde', 'Lucas Meyer', 'lucas.meyer@example.com', 'improve_endurance', 'beginner', 'user', false, 44, 5.1, true],
  ['u_bccddeef', 'Zoe Anderson', 'zoe.anderson@example.com', 'build_muscle', 'advanced', 'user', true, 31, 27.4, true],
  ['u_cddeeff0', 'Ravi Nair', 'ravi.nair@example.com', 'flexibility', 'intermediate', 'user', false, 19, 0.5, true],
  ['u_deeff001', 'Mia Kowalski', 'mia.kowalski@example.com', 'lose_weight', 'beginner', 'user', false, 9, 1.7, true],
  ['u_eff00112', 'Samuel Adeyemi', 'samuel.adeyemi@example.com', 'build_muscle', 'intermediate', 'user', false, 4, 0.8, false],
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
