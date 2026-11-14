import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CameraOff, Loader2, ScanBarcode, X } from 'lucide-react'
import { lookupBarcode } from '@/lib/barcode'

/**
 * Camera sheet for packaged-food barcodes. The ZXing decoder is imported only
 * when the sheet opens, so the main bundle never pays for it.
 */
export default function BarcodeScanner({ open, onClose, onFood }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const onFoodRef = useRef(onFood)
  const [phase, setPhase] = useState('starting') // starting | scanning | looking | error
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => { onFoodRef.current = onFood }, [onFood])

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false

    const start = async () => {
      setPhase('starting')
      setMessage('')
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 800,
        })
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (!result || cancelled) return
            const code = result.getText()
            try { controls.stop() } catch { /* already stopped */ }
            controlsRef.current = null
            setPhase('looking')
            lookupBarcode(code)
              .then((food) => {
                if (cancelled) return
                if (!food) {
                  setPhase('error')
                  setMessage("We couldn't find that product. Try another barcode or search by name.")
                  return
                }
                onFoodRef.current?.(food)
              })
              .catch(() => {
                if (cancelled) return
                setPhase('error')
                setMessage("Couldn't reach the food database. Check your connection and try again.")
              })
          }
        )
        if (cancelled) { controls.stop(); return }
        controlsRef.current = controls
        setPhase('scanning')
      } catch (err) {
        if (cancelled) return
        const denied = ['NotAllowedError', 'SecurityError', 'PermissionDeniedError'].includes(err?.name)
        setPhase('error')
        setMessage(denied
          ? 'Camera access is blocked. Allow camera access for this site in your browser settings, then try again.'
          : 'Could not start the camera. Close other camera apps and try again.')
      }
    }

    start()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelled = true
      try { controlsRef.current?.stop() } catch { /* noop */ }
      controlsRef.current = null
      document.body.style.overflow = previousOverflow
    }
  }, [open, attempt])

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="barcode-scanner"
        role="dialog"
        aria-modal="true"
        aria-label="Scan a barcode"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex flex-col bg-black text-white"
      >
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${phase === 'starting' ? 'opacity-0' : 'opacity-100'}`}
          playsInline
          muted
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

        <div className="relative z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            <span className="font-semibold">Scan barcode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20"
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

          {phase === 'looking' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 px-6 py-5 text-center backdrop-blur-md">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm font-semibold">Looking up that product…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex max-w-xs flex-col items-center gap-3 rounded-3xl bg-black/70 px-6 py-6 text-center backdrop-blur-md">
              <CameraOff className="h-8 w-8 text-white/70" />
              <p className="text-sm text-white/80">{message}</p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
              >
                Try again
              </button>
            </div>
          )}

          {phase === 'scanning' && (
            <div className="relative h-44 w-full max-w-xs overflow-hidden rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <span className="scanner-line absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.9)]" />
              <span className="absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-white" />
              <span className="absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-white" />
            </div>
          )}
        </div>

        <div className="relative z-10 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
          <p className="text-sm text-white/80">
            {phase === 'scanning' ? 'Point the camera at the barcode on the package.' : 'Hold the package steady inside the frame.'}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
