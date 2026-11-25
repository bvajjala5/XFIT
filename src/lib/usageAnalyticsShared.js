// Privacy-safe product analytics helpers.
//
// These functions are intentionally pure so they can be unit tested without
// Firebase or a browser. The app writes only daily counts and small categorical
// buckets to `users/{uid}/analyticsDays/{yyyy-mm-dd}` — never raw health values,
// food names, workout payloads, prompts, or message content.

export const ANALYTICS_COLLECTION = 'analyticsDays'

// Only these events may be recorded. Anything else is dropped on purpose.
export const EVENT_ALLOWLIST = Object.freeze({
  app_opened: [],
  signup_completed: [],
  sign_in_completed: [],
  sign_out: [],
  workout_started: ['workoutType'],
  workout_resumed: ['workoutType'],
  workout_completed: ['workoutType'],
  workout_logged: ['workoutType', 'queued'],
  workout_log_queued: ['workoutType'],
  workout_drop_off: ['reason'],
  custom_workout_saved: ['source'],
  custom_workout_shared: ['channel'],
  custom_workout_imported: ['source'],
  custom_workout_generate_success: [],
  custom_workout_generate_failure: [],
  pr_saved: ['source'],
  run_started: ['source'],
  run_completed: ['source'],
  run_import_saved: ['source'],
  run_import_duplicate: ['source'],
  run_import_failed: ['source'],
  food_logged: ['source'],
  food_correction_saved: [],
  food_correction_reset: [],
  health_permission_prompted: ['provider'],
  health_permission_granted: ['provider'],
  health_permission_denied: ['provider'],
  export_requested: [],
  export_succeeded: [],
  export_failed: [],
  deletion_requested: [],
  support_contacted: ['destination'],
  community_report_submitted: ['reason'],
  pwa_install_prompted: [],
  pwa_install_accepted: [],
  pwa_install_dismissed: [],
  pwa_app_installed: [],
  ai_request: ['mode'],
  ai_request_success: ['mode'],
  ai_request_failure: ['mode'],
  ai_rate_limited: [],
  firestore_write_failed: ['collection'],
})

// Attached to every allowed event. Values are coarse buckets, not identifiers.
export const COMMON_PROPS = Object.freeze(['platform', 'browser', 'os', 'appVersion'])

const MAX_BUCKET_LENGTH = 40

/** Local calendar day so the dashboard's "today" matches the user's today. */
export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Turn an arbitrary value into a small, safe analytics bucket. */
export function sanitizeBucket(value, fallback = 'other') {
  if (value === null || value === undefined) return fallback
  const text = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BUCKET_LENGTH)
  return text || fallback
}

function incrementMap(target, key, amount = 1) {
  target[key] = (target[key] || 0) + amount
}

/**
 * Convert a list of `{ name, props }` events into a numeric Firestore patch.
 * Unknown events and non-allowlisted props are discarded here.
 */
export function buildAnalyticsPatch(events = []) {
  const patch = { counts: {}, breakdowns: {} }

  for (const event of events) {
    if (!event || typeof event.name !== 'string') continue
    const allowed = EVENT_ALLOWLIST[event.name]
    if (!allowed) continue

    incrementMap(patch.counts, event.name)
    const props = event.props && typeof event.props === 'object' ? event.props : {}
    const keys = [...new Set([...allowed, ...COMMON_PROPS])]

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) continue
      const bucket = sanitizeBucket(props[key])
      if (!patch.breakdowns[event.name]) patch.breakdowns[event.name] = {}
      if (!patch.breakdowns[event.name][key]) patch.breakdowns[event.name][key] = {}
      incrementMap(patch.breakdowns[event.name][key], bucket)
    }
  }

  return patch
}

/** Merge two numeric patches, used while events are queued in memory. */
export function mergeAnalyticsPatches(target, source) {
  if (!target.counts) target.counts = {}
  if (!target.breakdowns) target.breakdowns = {}

  for (const [event, count] of Object.entries(source.counts || {})) {
    incrementMap(target.counts, event, count)
  }
  for (const [event, props] of Object.entries(source.breakdowns || {})) {
    if (!target.breakdowns[event]) target.breakdowns[event] = {}
    for (const [key, buckets] of Object.entries(props)) {
      if (!target.breakdowns[event][key]) target.breakdowns[event][key] = {}
      for (const [bucket, count] of Object.entries(buckets)) {
        incrementMap(target.breakdowns[event][key], bucket, count)
      }
    }
  }
  return target
}
