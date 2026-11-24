// Count-only product analytics. Events are batched in memory and written as a
// single daily document under the signed-in user's account. Existing Firestore
// rules already allow users/{uid} subcollections, so this needs no rules deploy.
//
// Never add raw health values, food names, prompts, workout payloads, emails or
// document IDs here. Use EVENT_ALLOWLIST in usageAnalyticsShared.js.

import { Capacitor } from '@capacitor/core'
import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { auth } from './firebase'
import { db } from './firestore'
import {
  ANALYTICS_COLLECTION,
  buildAnalyticsPatch,
  localDateKey,
  sanitizeBucket,
} from './usageAnalyticsShared'

const FLUSH_DELAY_MS = 1500
const pending = new Map() // uid → { date, events: [] }
let timer = null

function browserBucket(userAgent) {
  if (/edg\//i.test(userAgent)) return 'edge'
  if (/chrome\/|crios\//i.test(userAgent)) return 'chrome'
  if (/firefox\//i.test(userAgent)) return 'firefox'
  if (/safari\//i.test(userAgent)) return 'safari'
  return 'other'
}

function osBucket(userAgent) {
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
  if (/mac os x/i.test(userAgent)) return 'macos'
  if (/windows/i.test(userAgent)) return 'windows'
  if (/linux/i.test(userAgent)) return 'linux'
  return 'other'
}

function environmentProps() {
  if (typeof navigator === 'undefined') return {}
  const userAgent = navigator.userAgent || ''
  const native = typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform()
  return {
    platform: native ? 'android' : 'web',
    browser: native ? 'webview' : browserBucket(userAgent),
    os: osBucket(userAgent),
    appVersion: sanitizeBucket(import.meta.env.VITE_APP_VERSION || 'web'),
  }
}

function scheduleFlush() {
  if (timer || typeof window === 'undefined') return
  timer = window.setTimeout(() => {
    timer = null
    void flushAnalytics()
  }, FLUSH_DELAY_MS)
}

/** Queue one anonymous, count-only event for the currently signed-in user. */
export function track(eventName, props = {}) {
  const uid = auth.currentUser?.uid
  if (!uid) return

  const entry = pending.get(uid) || { date: localDateKey(), events: [] }
  entry.events.push({ name: eventName, props: { ...environmentProps(), ...props } })
  pending.set(uid, entry)
  scheduleFlush()
}

function toIncrementPatch(patch) {
  const counts = {}
  for (const [event, value] of Object.entries(patch.counts || {})) {
    counts[event] = increment(value)
  }

  const breakdowns = {}
  for (const [event, props] of Object.entries(patch.breakdowns || {})) {
    breakdowns[event] = {}
    for (const [key, buckets] of Object.entries(props)) {
      breakdowns[event][key] = {}
      for (const [bucket, value] of Object.entries(buckets)) {
        breakdowns[event][key][bucket] = increment(value)
      }
    }
  }

  return { counts, breakdowns, updatedAt: serverTimestamp() }
}

/** Write all queued counters. Safe to call repeatedly; an empty queue is a no-op. */
export async function flushAnalytics() {
  if (pending.size === 0) return
  const entries = [...pending.entries()]
  pending.clear()

  await Promise.all(
    entries.map(async ([uid, entry]) => {
      const patch = buildAnalyticsPatch(entry.events)
      if (Object.keys(patch.counts).length === 0) return
      try {
        await setDoc(
          doc(db, 'users', uid, ANALYTICS_COLLECTION, entry.date),
          toIncrementPatch(patch),
          { merge: true },
        )
      } catch {
        // Analytics must never break a workout, import, or purchase flow.
      }
    }),
  )
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    void flushAnalytics()
  })
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flushAnalytics()
    })
  }
}
