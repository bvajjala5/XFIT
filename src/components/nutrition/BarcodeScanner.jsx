import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CameraOff, CheckCircle2, Keyboard, Loader2, RotateCcw, ScanBarcode, Search, X } from 'lucide-react'
import { lookupBarcode } from '@/lib/barcode'

/**
 * Camera sheet for packaged-food barcodes. The ZXing decoder is imported only
 * when the sheet opens, so the main bundle never pays for it.
 *
 * The screen has one clearly-labelled state at a time so it is obvious what is
 * happening: starting → scanning → looking up → found, or a recoverable
 * "no match" / "camera unavailable" state that always offers a way forward
 * (scan again, search by name, or type the barcode in by hand).
 */
export default function BarcodeScanner({ open, onClose, onFood, onSearchByName }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const onFoodRef = useRef(onFood)
  // starting | scanning | looking | found | no-match | blocked | manual
  const [phase, setPhase] = useState('starting')
  const [message, setMessage] = useState('')
  const [found, setFound] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [manualBusy, setManualBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => { onFoodRef.current = onFood }, [onFood])

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false

    const start = async () => {
      setPhase('starting')
      setMessage('')
      setFound(null)
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
                  setPhase('no-match')
                  setMessage(`No product matches the code ${code}.`)
                  return
                }
                setFound(food)
                setPhase('found')
              })
              .catch(() => {
                if (cancelled) return
                setPhase('no-match')
                setMessage("We reached the food database but couldn't read the result. Check your connection and try again.")
              })
          }
        )
        if (cancelled) { controls.stop(); return }
        controlsRef.current = controls
        setPhase('scanning')
      } catch (err) {
        if (cancelled) return
        const denied = ['NotAllowedError', 'SecurityError', 'PermissionDeniedError'].includes(err?.name)
        setPhase('blocked')
        setMessage(denied
          ? 'Camera access is blocked. Allow camera access for this site in your browser settings, then try again.'
          : 'We could not start the camera. Close any other app that is using it, then try again.')
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

  // A found product shows a short confirmation, then hands off to the amount
  // screen. The button lets people skip the wait.
  useEffect(() => {
    if (phase !== 'found' || !found) return undefined
    const timer = window.setTimeout(() => onFoodRef.current?.(found), 1100)
    return () => window.clearTimeout(timer)
  }, [phase, found])

  const scanAgain = () => {
    setManualCode('')
    setFound(null)
    setMessage('')
    setAttempt((n) => n + 1)
  }

  const searchByName = () => {
    try { controlsRef.current?.stop() } catch { /* noop */ }
    controlsRef.current = null
    onClose?.()
    onSearchByName?.()
  }

  // Stop the camera before manual entry so a background scan can't take over
  // the screen while someone is typing.
  const enterManual = () => {
    try { controlsRef.current?.stop() } catch { /* noop */ }
    controlsRef.current = null
    setMessage('')
    setPhase('manual')
  }

  const submitManual = async () => {
    const code = manualCode.replace(/\D/g, '')
    if (code.length < 6) {
      setMessage('Enter at least 6 digits — the number printed under the barcode.')
      return
    }
    setManualBusy(true)
    setMessage('')
    try {
      const food = await lookupBarcode(code)
      if (!food) {
        setMessage(`No product matches the code ${code}.`)
        return
      }
      setFound(food)
      setPhase('found')
    } catch {
      setMessage("Couldn't reach the food database. Check your connection and try again.")
    } finally {
      setManualBusy(false)
    }
  }

  if (!open) return null

  const onVideo = phase === 'starting' || phase === 'scanning'

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
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${onVideo ? 'opacity-100' : 'opacity-20'}`}
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

          {phase === 'scanning' && (
            <div className="relative h-44 w-full max-w-xs overflow-hidden rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <span className="scanner-line absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.9)]" />
              <span className="absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-white" />
              <span className="absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-white" />
            </div>
          )}

          {phase === 'looking' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 px-6 py-5 text-center backdrop-blur-md">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm font-semibold">Looking up that product…</p>
            </div>
          )}

          {phase === 'found' && found && (
            <div className="w-full max-w-xs rounded-3xl bg-black/75 p-5 text-center backdrop-blur-md">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Match found</p>
              <p className="mt-1 text-base font-bold leading-tight">{found.name}</p>
              {found.brand && <p className="text-xs text-white/60">{found.brand}</p>}
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10px]">
                {[
                  ['kcal', found.per100?.calories],
                  ['protein', found.per100?.protein],
                  ['carbs', found.per100?.carbs],
                  ['fat', found.per100?.fat],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/10 py-1.5">
                    <p className="font-bold tabular-nums">{Math.round(Number(value) || 0)}</p>
                    <p className="text-white/55">{label}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onFoodRef.current?.(found)}
                className="mt-4 w-full rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
              >
                Add to log
              </button>
              <p className="mt-2 text-[10px] text-white/45">Per 100 g · opening the amount screen…</p>
            </div>
          )}

          {phase === 'no-match' && (
            <div className="w-full max-w-xs rounded-3xl bg-black/75 p-5 text-center backdrop-blur-md">
              <ScanBarcode className="mx-auto h-8 w-8 text-white/60" />
              <p className="mt-2 text-sm font-semibold">No match for that code</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                {message || "We couldn't find that product."} Not every product is in the database yet.
              </p>
              <div className="mt-4 space-y-2">
                <button type="button" onClick={scanAgain} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
                  <RotateCcw className="h-3.5 w-3.5" /> Scan another
                </button>
                <button type="button" onClick={searchByName} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                  <Search className="h-3.5 w-3.5" /> Search by name
                </button>
                <button type="button" onClick={enterManual} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                  <Keyboard className="h-3.5 w-3.5" /> Enter it manually
                </button>
              </div>
            </div>
          )}

          {phase === 'blocked' && (
            <div className="w-full max-w-xs rounded-3xl bg-black/75 p-5 text-center backdrop-blur-md">
              <CameraOff className="mx-auto h-8 w-8 text-white/60" />
              <p className="mt-2 text-sm font-semibold">Camera unavailable</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{message}</p>
              <div className="mt-4 space-y-2">
                <button type="button" onClick={scanAgain} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
                  <RotateCcw className="h-3.5 w-3.5" /> Try the camera again
                </button>
                <button type="button" onClick={enterManual} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                  <Keyboard className="h-3.5 w-3.5" /> Enter the barcode manually
                </button>
                <button type="button" onClick={searchByName} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                  <Search className="h-3.5 w-3.5" /> Search by name instead
                </button>
              </div>
            </div>
          )}

          {phase === 'manual' && (
            <div className="w-full max-w-xs rounded-3xl bg-black/80 p-5 backdrop-blur-md">
              <Keyboard className="mx-auto h-7 w-7 text-white/70" />
              <p className="mt-2 text-center text-sm font-semibold">Type the barcode</p>
              <p className="mt-1 text-center text-xs leading-relaxed text-white/60">
                Enter the digits printed under the barcode (usually 8–13).
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={manualCode}
                onChange={(e) => { setManualCode(e.target.value.replace(/\D/g, '').slice(0, 14)); setMessage('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') submitManual() }}
                placeholder="e.g. 5000112637922"
                aria-label="Barcode number"
                className="mt-3 h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-center text-base font-semibold tracking-[0.15em] text-white outline-none placeholder:text-white/35 focus:border-white/50"
              />
              {message && <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-200">{message}</p>}
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={submitManual}
                  disabled={manualBusy || manualCode.length < 6}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
                >
                  {manualBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Look up
                </button>
                <button type="button" onClick={scanAgain} className="w-full rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                  Use the camera instead
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 space-y-3 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
          <p className="text-sm text-white/80">
            {phase === 'scanning'
              ? 'Point the camera at the barcode on the package and hold steady.'
              : phase === 'starting'
                ? 'Getting the camera ready…'
                : phase === 'found'
                  ? 'Found it — taking you to the amount screen.'
                  : 'You can always search by name or type the code in by hand.'}
          </p>
          {phase === 'scanning' && (
            <button
              type="button"
              onClick={enterManual}
              className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Keyboard className="h-3.5 w-3.5" /> Enter barcode manually
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
