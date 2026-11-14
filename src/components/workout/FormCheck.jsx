import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CameraOff, Loader2, Play, RotateCcw, ShieldCheck, Sparkles, Square, X } from 'lucide-react'
import { analyzeForm } from '@/lib/formCheck'

// One frame every 12s keeps a live check at 5 requests/minute, comfortably
// inside the AI proxy's 10-per-minute per-user limit.
const AUTO_INTERVAL_MS = 12_000
const MIN_GAP_MS = 6_000

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Full-screen camera sheet that keeps the stream open and checks a frame every
 * few seconds while the person trains. It is an overlay, never a route, so
 * closing it returns the user to exactly where they were in the workout.
 * Nothing is recorded or stored — only small JPEG frames are sent for cues.
 */
export default function FormCheck({ open, onClose, exerciseName }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const busyRef = useRef(false)
  const lastCheckRef = useRef(0)
  const startedAtRef = useRef(0)
  const sessionRef = useRef(0)

  const [phase, setPhase] = useState('starting') // starting | ready | live | error
  const [feedback, setFeedback] = useState('')
  const [checks, setChecks] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [hasRun, setHasRun] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cueError, setCueError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const stopCamera = useCallback(() => {
    const stream = streamRef.current
    if (stream) stream.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }, [])

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    sessionRef.current += 1
    busyRef.current = false
    lastCheckRef.current = 0

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const start = async () => {
      setPhase('starting')
      setFeedback('')
      setChecks(0)
      setElapsed(0)
      setHasRun(false)
      setBusy(false)
      setError('')
      setCueError('')
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        if (!cancelled) setPhase('ready')
      } catch (err) {
        if (cancelled) return
        const denied = ['NotAllowedError', 'SecurityError', 'PermissionDeniedError'].includes(err?.name)
        setError(denied
          ? 'Camera access is blocked. Allow camera access for this site in your browser settings, then try again.'
          : 'Could not start the camera. Close other camera apps and try again.')
        setPhase('error')
      }
    }

    start()

    return () => {
      cancelled = true
      // Ignore responses from a check that was still in flight when the sheet closed.
      sessionRef.current += 1
      stopCamera()
      document.body.style.overflow = previousOverflow
    }
  }, [open, attempt, stopCamera])

  /** Grab a small JPEG frame without interrupting the live preview. */
  const grabFrame = useCallback(() => {
    const video = videoRef.current
    if (!video?.videoWidth || !video?.videoHeight) return null

    const maxEdge = 720
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.75)
  }, [])

  const runCheck = useCallback(async ({ force = false } = {}) => {
    if (busyRef.current) return
    if (!force && document.visibilityState !== 'visible') return

    const now = Date.now()
    if (now - lastCheckRef.current < MIN_GAP_MS) return

    const dataUrl = grabFrame()
    if (!dataUrl) return

    const session = sessionRef.current
    lastCheckRef.current = now
    busyRef.current = true
    setBusy(true)
    setCueError('')
    try {
      const text = await analyzeForm(exerciseName, dataUrl)
      if (session !== sessionRef.current) return
      setFeedback(text)
      setChecks((n) => n + 1)
    } catch (err) {
      if (session !== sessionRef.current) return
      setCueError(err?.message || 'The coach could not review that moment. Keep training — the next check will try again.')
    } finally {
      if (session === sessionRef.current) {
        busyRef.current = false
        setBusy(false)
      }
    }
  }, [exerciseName, grabFrame])

  // While live, check the first frame quickly and then at a steady interval.
  useEffect(() => {
    if (phase !== 'live') return undefined
    const first = window.setTimeout(() => runCheck(), 1600)
    const timer = window.setInterval(() => runCheck(), AUTO_INTERVAL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [phase, runCheck])

  useEffect(() => {
    if (phase !== 'live') return undefined
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  const startLive = () => {
    startedAtRef.current = Date.now()
    lastCheckRef.current = 0
    setElapsed(0)
    setChecks(0)
    setFeedback('')
    setCueError('')
    setHasRun(true)
    setPhase('live')
  }

  const stopLive = () => setPhase('ready')
  const retry = () => setAttempt((n) => n + 1)
  const close = () => {
    stopCamera()
    onClose()
  }

  if (!open) return null

  const showFrame = phase === 'ready' || phase === 'live'

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="form-check"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-check-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[96] flex flex-col bg-black text-white"
      >
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${phase === 'error' ? 'opacity-20' : 'opacity-100'}`}
          playsInline
          muted
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />

        <div className="relative z-10 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Form check</p>
            <h2 id="form-check-title" className="truncate font-bold">{exerciseName || 'Your exercise'}</h2>
            {phase === 'live' && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-red-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                LIVE · {formatClock(elapsed)} · {checks} {checks === 1 ? 'check' : 'checks'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Back to workout"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-2">
          {phase === 'starting' && (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-black/75 px-6 py-6 text-center backdrop-blur-md">
              <CameraOff className="h-8 w-8 text-white/70" />
              <p className="text-sm text-white/85">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
            </div>
          )}

          {showFrame && (
            <div className="flex w-full max-w-sm flex-col items-center gap-3.5">
              <div className="pointer-events-none relative h-[34vh] min-h-[180px] max-h-[320px] w-full rounded-[2rem] border border-white/25">
                <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
                <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
                <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
                <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-primary" />
                {busy && (
                  <span className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-md">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking this moment…
                  </span>
                )}
              </div>

              {feedback && (
                <motion.div
                  key={checks}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  aria-live="polite"
                  className="w-full rounded-2xl border border-white/15 bg-black/75 p-4 backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </span>
                      <p className="text-xs font-bold">Coach cue</p>
                    </div>
                    {checks > 0 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                        #{checks}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{feedback}</p>
                </motion.div>
              )}

              {cueError && (
                <p role="status" className="rounded-xl bg-amber-400/15 px-3 py-2 text-center text-[11px] leading-relaxed text-amber-100">
                  {cueError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10 space-y-3 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {phase === 'ready' && (
            <>
              <p className="text-center text-xs text-white/70">
                Prop your phone up so your whole body stays in frame. The coach checks a few frames as you train.
              </p>
              <button
                type="button"
                onClick={startLive}
                className="mx-auto flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-black transition-transform active:scale-[0.98]"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                {hasRun ? 'Resume live check' : 'Start live check'}
              </button>
            </>
          )}

          {phase === 'live' && (
            <div className="mx-auto flex w-full max-w-sm gap-2">
              <button
                type="button"
                onClick={stopLive}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/12 px-3 py-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" /> Stop
              </button>
              <button
                type="button"
                onClick={() => runCheck({ force: true })}
                disabled={busy}
                className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-white px-3 py-3 text-xs font-bold text-black transition-opacity disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />} Check now
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-full bg-white/12 px-3 py-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                Done
              </button>
            </div>
          )}

          {showFrame && (
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/45">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              Frames are checked on the fly and never stored.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
