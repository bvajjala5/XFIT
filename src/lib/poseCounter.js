// On-device rep detection: landmark geometry + a small hysteresis state machine.
// Pure functions only — MediaPipe is loaded lazily by the camera component.

export const MOVEMENTS = {
  squat: {
    label: 'Squats',
    hint: 'Stand sideways to the camera so hips, knees and ankles stay visible.',
    points: [23, 24, 25, 26, 27, 28],
    read(lm) {
      const left = angleAt(point(lm, 23), point(lm, 25), point(lm, 27))
      const right = angleAt(point(lm, 24), point(lm, 26), point(lm, 28))
      const value = average(left, right)
      return { value, start: value <= 105, end: value >= 160 }
    },
  },
  pushup: {
    label: 'Push-ups',
    hint: 'Set the phone to the side. Keep shoulders, elbows and wrists in frame.',
    points: [11, 12, 13, 14, 15, 16],
    read(lm) {
      const left = angleAt(point(lm, 11), point(lm, 13), point(lm, 15))
      const right = angleAt(point(lm, 12), point(lm, 14), point(lm, 16))
      const value = average(left, right)
      return { value, start: value <= 90, end: value >= 150 }
    },
  },
  curl: {
    label: 'Bicep curls',
    hint: 'Face the camera and keep your upper arm still.',
    points: [11, 12, 13, 14, 15, 16],
    read(lm) {
      const left = angleAt(point(lm, 11), point(lm, 13), point(lm, 15))
      const right = angleAt(point(lm, 12), point(lm, 14), point(lm, 16))
      const value = average(left, right)
      return { value, start: value >= 150, end: value <= 65 }
    },
  },
  press: {
    label: 'Overhead press',
    hint: 'Face slightly sideways so the elbow and wrist stay visible overhead.',
    points: [11, 12, 13, 14, 15, 16, 23, 24],
    read(lm) {
      const shoulder = averagePoint(point(lm, 11), point(lm, 12))
      const elbow = averagePoint(point(lm, 13), point(lm, 14))
      const wrist = averagePoint(point(lm, 15), point(lm, 16))
      const value = angleAt(shoulder, elbow, wrist)
      const overhead = !!wrist && !!shoulder && wrist.y < shoulder.y - 0.05
      return {
        value,
        start: value <= 95 && !overhead,
        end: value >= 150 && overhead,
      }
    },
  },
  jacks: {
    label: 'Jumping jacks',
    hint: 'Face the camera with your full body in frame.',
    points: [11, 12, 15, 16, 23, 24],
    read(lm) {
      const lShoulder = point(lm, 11)
      const rShoulder = point(lm, 12)
      const lWrist = point(lm, 15)
      const rWrist = point(lm, 16)
      const armsUp = !!(lShoulder && rShoulder && lWrist && rWrist) &&
        lWrist.y < lShoulder.y - 0.05 && rWrist.y < rShoulder.y - 0.05
      const armsDown = !!(lShoulder && rShoulder && lWrist && rWrist) &&
        lWrist.y > lShoulder.y + 0.08 && rWrist.y > rShoulder.y + 0.08
      return { value: armsUp ? 100 : armsDown ? 0 : 50, start: armsDown, end: armsUp }
    },
  },
}

export const SUPPORTED_MOVEMENTS = Object.keys(MOVEMENTS)

export function movementFromExercise(name = '') {
  const text = String(name).toLowerCase()
  if (/squat|goblet/.test(text)) return 'squat'
  if (/push.?up|press.?up/.test(text)) return 'pushup'
  if (/curl/.test(text)) return 'curl'
  if (/overhead|shoulder press|military press/.test(text)) return 'press'
  if (/jumping jack|jack/.test(text)) return 'jacks'
  return null
}

export function point(landmarks, index) {
  const p = landmarks?.[index]
  return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : null
}

export function distance(a, b) {
  if (!a || !b) return null
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Interior angle in degrees at point b. */
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y)
  if (!mag) return null
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI
}

const average = (...values) => {
  const valid = values.filter((v) => Number.isFinite(v))
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

const averagePoint = (a, b) => {
  if (!a || !b) return null
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function confidenceFor(landmarks, movement) {
  const cfg = MOVEMENTS[movement]
  if (!cfg) return 0
  const values = cfg.points
    .map((i) => landmarks?.[i]?.visibility)
    .filter((v) => Number.isFinite(v))
  return values.length === cfg.points.length ? average(...values) : 0
}

export function confidenceLabel(confidence) {
  if (confidence >= 0.75) return 'good'
  if (confidence >= 0.5) return 'fair'
  return 'low'
}

export const initialCounter = () => ({ count: 0, phase: 'ready', lastCountAt: 0, confidence: 0, reliable: false, value: null })

/**
 * Feed one frame's normalized landmarks into the state machine. Reps only count
 * after the "start" position is seen and only when tracking confidence is high
 * enough, so a bad frame or a half-rep cannot increment the counter.
 */
export function updateRepCounter(state = initialCounter(), landmarks, movement, options = {}) {
  const cfg = MOVEMENTS[movement]
  const confidence = confidenceFor(landmarks, movement)
  const minConfidence = options.minConfidence ?? 0.6
  if (!cfg || !landmarks?.length || confidence < minConfidence) {
    return { ...state, confidence, reliable: false }
  }

  const signal = cfg.read(landmarks)
  if (!Number.isFinite(signal.value)) return { ...state, confidence, reliable: false }

  const now = options.now ?? Date.now()
  const debounceMs = options.debounceMs ?? 350
  let phase = state.phase || 'ready'
  let count = state.count || 0
  let lastCountAt = state.lastCountAt || 0

  if (phase === 'ready' && signal.start) {
    phase = 'armed'
  } else if (phase === 'armed' && signal.end) {
    if (now - lastCountAt >= debounceMs) {
      count += 1
      lastCountAt = now
    }
    phase = 'ready'
  }

  return { ...state, count, phase, lastCountAt, confidence, reliable: true, value: signal.value }
}
