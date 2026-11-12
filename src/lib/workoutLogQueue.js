import { db } from './firestore'
import { doc, setDoc, Timestamp } from 'firebase/firestore/lite'

// Firestore's lite SDK does not keep an offline write queue, so completed
// sessions get a durable local entry first. Writes use a client-generated id,
// which makes retries idempotent: syncing an entry twice overwrites the same
// document instead of creating a duplicate.
const QUEUE_KEY = 'xfit_pending_workout_logs_v1'
const WRITE_TIMEOUT_MS = 8_000
export const WORKOUT_LOGS_CHANGED = 'xfit:workout-logs-changed'

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function notifyChanged() {
  try {
    window.dispatchEvent(new CustomEvent(WORKOUT_LOGS_CHANGED))
  } catch {
    // The event is only a UI hint; queueing still works without it.
  }
}

function readQueue() {
  const store = storage()
  if (!store) return []
  try {
    const raw = store.getItem(QUEUE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue) {
  const store = storage()
  if (!store) return false
  try {
    store.setItem(QUEUE_KEY, JSON.stringify(queue))
    return true
  } catch (error) {
    console.warn('Could not store a pending workout log:', error)
    return false
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function makeEntry(uid, log) {
  const { id: _ignored, pending: _pending, ...data } = log || {}
  return {
    id: log?.id || makeId(),
    uid,
    queuedAt: new Date().toISOString(),
    log: data,
  }
}

function toFirestore(entry) {
  const when = new Date(entry.log?.completedAt || entry.queuedAt)
  return {
    ...entry.log,
    completedAt: Number.isNaN(when.getTime()) ? Timestamp.now() : Timestamp.fromDate(when),
  }
}

function writeEntry(entry) {
  return setDoc(doc(db, 'users', entry.uid, 'workouts', entry.id), toFirestore(entry))
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firestore write timed out')), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}

function enqueue(entry) {
  const queue = readQueue().filter((item) => item.id !== entry.id)
  queue.push(entry)
  if (!writeQueue(queue)) return false
  notifyChanged()
  return true
}

/** Pending logs for this user, oldest first. Used to show the session immediately. */
export function getPendingWorkoutLogs(uid) {
  if (!uid) return []
  return readQueue().filter((entry) => entry.uid === uid)
}

export function getPendingWorkoutLogCount(uid) {
  return getPendingWorkoutLogs(uid).length
}

/**
 * Save a finished workout. If the network is down (or the write fails/times
 * out), the session is queued locally instead of being lost.
 * Returns `{ queued: true }` when it is waiting for a connection.
 */
export async function saveWorkoutLog(uid, log) {
  if (!uid) throw new Error('A signed-in user is required to save a workout')
  const entry = makeEntry(uid, log)

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (!enqueue(entry)) throw new Error('Could not store this workout on the device')
    return { queued: true, id: entry.id }
  }

  try {
    await withTimeout(writeEntry(entry), WRITE_TIMEOUT_MS)
    return { queued: false, id: entry.id }
  } catch (error) {
    console.warn('Workout log write failed; keeping it on this device.', error)
    if (!enqueue(entry)) throw new Error('Could not store this workout on the device')
    return { queued: true, id: entry.id }
  }
}

/** Write queued sessions to Firestore, stopping at the first network failure. */
export async function flushWorkoutLogQueue(uid) {
  if (!uid) return 0
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0

  const pending = getPendingWorkoutLogs(uid)
  let synced = 0

  for (const entry of pending) {
    try {
      await withTimeout(writeEntry(entry), WRITE_TIMEOUT_MS)
      const remaining = readQueue().filter((item) => item.id !== entry.id)
      writeQueue(remaining)
      synced += 1
    } catch (error) {
      console.warn('Workout log sync paused; will retry when online.', error)
      break
    }
  }

  if (synced > 0) notifyChanged()
  return synced
}
