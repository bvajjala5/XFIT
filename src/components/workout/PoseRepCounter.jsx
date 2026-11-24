import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraOff, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import {
  MOVEMENTS, confidenceLabel, initialCounter, updateRepCounter,
} from '@/lib/poseCounter'

// Loaded only while the camera is on. Keeping these out of the main bundle
// means a normal workout never downloads the pose model or the WASM runtime.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const FRAME_MS = 50 // ~20fps is plenty for joint-angle reps and saves battery

const CONFIDENCE_COLOR = {
  good: 'bg-green-500',
  fair: 'bg-amber-500',
  low: 'bg-red-500',
}

/**
 * Compact, opt-in camera panel. All inference happens on the device; no video
 * or landmark data is uploaded. The stream, landmarker and animation frame are
 * torn down as soon as the panel closes or the component unmounts.
 */
export default function PoseRepCounter({ active, movement = 'squat', onRep, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const landmarkerRef = useRef(null)
  const frameRef = useRef(0)
  const counterRef = useRef(initialCounter())
  const lastRepRef = useRef(0)
  const lastFrameRef = useRef(0)
  const onRepRef = useRef(onRep)
  const cfg = MOVEMENTS[movement] || MOVEMENTS.squat

  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const [counter, setCounter] = useState(initialCounter)

  useEffect(() => { onRepRef.current = onRep }, [onRep])

  const stopAll = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    const stream = streamRef.current
    if (stream) stream.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    const landmarker = landmarkerRef.current
    landmarkerRef.current = null
    if (landmarker?.close) {
      try { landmarker.close() } catch { /* already closed */ }
    }
  }, [])

  useEffect(() => {
    if (!active) {
      stopAll()
      counterRef.current = initialCounter()
      lastRepRef.current = 0
      queueMicrotask(() => {
        setCounter(initialCounter())
        setStatus('idle')
        setError('')
      })
      return undefined
    }

    let cancelled = false

    const start = async () => {
      let stream = null
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')

        const vision = await import('@mediapipe/tasks-vision')
        if (cancelled) return
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL)
        if (cancelled) return

        const options = {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }
        let landmarker
        try {
          landmarker = await vision.PoseLandmarker.createFromOptions(fileset, options)
        } catch {
          // Some older devices have no usable WebGL context.
          landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: 'CPU' },
          })
        }
        if (cancelled) {
          landmarker?.close?.()
          return
        }
        landmarkerRef.current = landmarker

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) throw new Error('no video element')
        video.srcObject = stream
        await video.play().catch(() => {})
        if (cancelled) return
        setStatus('ready')

        const draw = (landmarks) => {
          const canvas = canvasRef.current
          if (!canvas || !video.videoWidth) return
          const w = canvas.width = video.videoWidth
          const h = canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.clearRect(0, 0, w, h)
          if (!landmarks) return
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)'
          ctx.lineWidth = Math.max(2, w / 220)
          for (const { start, end } of vision.PoseLandmarker.POSE_CONNECTIONS) {
            const a = landmarks[start]
            const b = landmarks[end]
            if (!a || !b) continue
            ctx.beginPath()
            ctx.moveTo(a.x * w, a.y * h)
            ctx.lineTo(b.x * w, b.y * h)
            ctx.stroke()
          }
        }

        const tick = (now) => {
          if (cancelled) return
          frameRef.current = requestAnimationFrame(tick)
          if (now - lastFrameRef.current < FRAME_MS) return
          lastFrameRef.current = now
          if (video.readyState < 2 || document.visibilityState !== 'visible') return

          let landmarks = null
          try {
            const result = landmarker.detectForVideo(video, now)
            landmarks = result?.landmarks?.[0] || null
          } catch {
            // A dropped frame is normal; the next one will recover.
          }
          draw(landmarks)

          const next = updateRepCounter(counterRef.current, landmarks, movement, { now: Date.now() })
          counterRef.current = next
          if (next.count > lastRepRef.current) {
            const delta = next.count - lastRepRef.current
            lastRepRef.current = next.count
            onRepRef.current?.(delta)
          }
          setCounter(next)
        }
        frameRef.current = requestAnimationFrame(tick)
      } catch (err) {
        if (cancelled) return
        if (stream) stream.getTracks().forEach((track) => track.stop())
        const denied = ['NotAllowedError', 'SecurityError', 'PermissionDeniedError'].includes(err?.name)
        setError(denied
          ? 'Camera access is blocked. Allow it in your browser settings, then try again.'
          : err?.message === 'unsupported'
            ? 'This browser cannot run on-device pose detection.'
            : 'Could not start the camera counter. You can still log reps manually.')
        setStatus('error')
      }
    }

    queueMicrotask(() => {
      if (cancelled) return
      setStatus('loading')
      setError('')
      counterRef.current = initialCounter()
      lastRepRef.current = 0
      setCounter(initialCounter())
      start()
    })
    return () => {
      cancelled = true
      stopAll()
    }
  }, [active, movement, stopAll])

  if (!active) return null

  const label = confidenceLabel(counter.confidence)

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card/80 p-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate text-[11px] font-bold">Camera rep counter</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5" aria-label="Turn off camera counter">
          <CameraOff className="h-4 w-4" />
        </button>
      </div>

      {status === 'error' ? (
        <p className="mt-2 text-[11px] leading-snug text-amber-500">{error}</p>
      ) : (
        <>
          <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/70">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ transform: 'scaleX(-1)' }} />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[11px]">Loading pose model…</span>
              </div>
            )}
            {status === 'ready' && (
              <div className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-center">
                <div className="text-xl font-black tabular-nums text-white">{counter.count}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/70">auto reps</div>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Confidence</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${CONFIDENCE_COLOR[label]}`}
                style={{ width: `${Math.round(counter.confidence * 100)}%` }}
              />
            </div>
            <span className={`w-10 text-right text-[10px] font-bold capitalize ${label === 'good' ? 'text-green-500' : label === 'fair' ? 'text-amber-500' : 'text-red-500'}`}>{label}</span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            {counter.reliable ? cfg.hint : 'Step back so your full body is visible. Manual +/- always works.'}
          </p>
        </>
      )}
      <p className="mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 shrink-0" /> On-device only — no video leaves your phone.
      </p>
    </div>
  )
}
