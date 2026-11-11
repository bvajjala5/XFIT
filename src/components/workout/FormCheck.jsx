import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CameraOff, Loader2, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react'
import BrandLoader from '@/components/brand/BrandLoader'
import { analyzeForm } from '@/lib/formCheck'

/**
 * Full-screen camera sheet that captures one frame and asks the Uttar AI coach
 * for form cues. It is an overlay, never a route, so closing it returns the
 * user to exactly where they were in the workout.
 */
export default function FormCheck({ open, onClose, exerciseName }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('starting') // starting | ready | analyzing | result | error
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [shot, setShot] = useState(null)
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
    setPhase('starting')
    setFeedback('')
    setError('')
    setShot(null)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const start = async () => {
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
      stopCamera()
      document.body.style.overflow = previousOverflow
    }
  }, [open, attempt, stopCamera])

  const capture = async () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video?.videoHeight) return

    // Keep the upload small: a 720px JPEG is plenty for posture cues and keeps
    // the request comfortably inside the proxy's image limit.
    const maxEdge = 720
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
    setShot(dataUrl)
    stopCamera()
    setPhase('analyzing')

    try {
      const text = await analyzeForm(exerciseName, dataUrl)
      setFeedback(text)
      setPhase('result')
    } catch (err) {
      setError(err?.message || 'The coach could not review that frame. Try again.')
      setPhase('error')
    }
  }

  const retry = () => setAttempt((n) => n + 1)
  const close = () => {
    stopCamera()
    onClose()
  }

  if (!open) return null

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
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${['ready', 'starting'].includes(phase) ? 'opacity-100' : 'opacity-30'}`}
          playsInline
          muted
          autoPlay
        />
        {shot && (
          <img
            src={shot}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${['analyzing', 'result'].includes(phase) ? 'opacity-40' : 'opacity-0'}`}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85" />

        <div className="relative z-10 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Form check</p>
            <h2 id="form-check-title" className="truncate font-bold">{exerciseName || 'Your exercise'}</h2>
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

        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          {phase === 'starting' && (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}

          {phase === 'ready' && (
            <div className="pointer-events-none relative h-[58vh] max-h-[520px] w-full max-w-sm rounded-[2rem] border border-white/25">
              <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
              <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
              <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
              <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-primary" />
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="rounded-3xl bg-black/65 px-6 py-6 text-center backdrop-blur-md">
              <BrandLoader size="md" label="Uttar AI is checking your form…" className="[&_p]:text-white/80" />
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

          {phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/15 bg-black/80 p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <p className="text-sm font-bold">Coach feedback</p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{feedback}</p>
              <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-white/45">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
                One frame was sent securely to Uttar AI for feedback. Nothing is stored.
              </p>
            </motion.div>
          )}
        </div>

        <div className="relative z-10 space-y-3 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {phase === 'ready' && (
            <>
              <p className="text-center text-xs text-white/70">
                Prop your phone up so your whole body is in frame.
              </p>
              <button
                type="button"
                onClick={capture}
                className="mx-auto flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-black active:scale-[0.98] transition-transform"
              >
                <Camera className="h-5 w-5" /> Check my form
              </button>
            </>
          )}

          {phase === 'result' && (
            <div className="mx-auto flex w-full max-w-sm gap-2">
              <button
                type="button"
                onClick={retry}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" /> Check again
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-bold text-black"
              >
                Back to workout
              </button>
            </div>
          )}

          {phase === 'analyzing' && (
            <p className="text-center text-xs text-white/50">This usually takes a few seconds.</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
