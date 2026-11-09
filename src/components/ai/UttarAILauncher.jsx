import React, { Suspense, lazy, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import useFocusTrap from '@/hooks/useFocusTrap'

// The coach is loaded on first intent (hover/focus/tap) so the AI bundle never
// competes with the first paint of the screen behind it.
const UttarAI = lazy(() => import('@/pages/UttarAI'))
const preloadAI = () => import('@/pages/UttarAI').catch(() => {})

/** The Uttar barbell emblem, shared with the app logo, marks the AI coach. */
function EmblemMark({ className = '' }) {
  return (
    <img
      src="/icons/emblem-white.png"
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`select-none object-contain ${className}`}
    />
  )
}

function AILoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-fuchsia-500 shadow-lg shadow-primary/25">
        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
        <EmblemMark className="relative w-9" />
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Waking up your coach…
      </p>
    </div>
  )
}

export default function UttarAILauncher({ open, onOpenChange }) {
  const panelRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const close = () => onOpenChange(false)
  useFocusTrap(panelRef, open, close)

  // Lock background scrolling while the coach sheet is open.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  const fab = (
    <motion.button
      key="uttar-ai-fab"
      type="button"
      onClick={() => onOpenChange(true)}
      onPointerEnter={preloadAI}
      onFocus={preloadAI}
      aria-label="Open Uttar AI coach"
      aria-haspopup="dialog"
      aria-expanded={open}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="ai-fab group fixed right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/40 md:right-8"
    >
      {/* Breathing aura */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2.5 rounded-full bg-gradient-to-tr from-primary/60 via-fuchsia-500/45 to-sky-400/55 blur-xl"
        animate={reduceMotion ? undefined : { opacity: [0.45, 0.9, 0.45], scale: [1, 1.12, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orb */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-indigo-500 to-fuchsia-500 shadow-[0_10px_30px_-6px_rgba(59,130,246,0.75)]" />
      <span className="absolute inset-[1.5px] rounded-full bg-gradient-to-b from-white/25 via-transparent to-transparent" />
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />

      <EmblemMark className="relative w-[30px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110 md:w-8" />

      {/* Desktop label */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full border border-border/60 bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
        Ask Uttar AI
      </span>
    </motion.button>
  )

  return (
    <>
      <AnimatePresence>{!open && fab}</AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="uttar-ai-overlay"
              className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={close}
                aria-hidden="true"
              />

              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="uttar-ai-title"
                tabIndex={-1}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.985 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.99 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
                className="relative flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-border/60 bg-background shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.8)] outline-none md:h-[min(86dvh,54rem)] md:rounded-[1.75rem]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                <div className="relative mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden="true" />

                <Suspense fallback={<AILoading />}>
                  <UttarAI onClose={close} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
