import { Suspense, lazy, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import useFocusTrap from '@/hooks/useFocusTrap'
import BrandLoader from '@/components/brand/BrandLoader'

// The coach is loaded on first intent (hover/focus/tap) so the AI bundle never
// competes with the first paint of the screen behind it.
const UttarAI = lazy(() => import('@/pages/UttarAI'))
export const preloadUttarAI = () => import('@/pages/UttarAI').catch(() => {})

function AILoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <BrandLoader size="md" label="Waking up your coach…" />
    </div>
  )
}

/**
 * Uttar AI's panel. The visible trigger lives in the app chrome (the sidebar
 * logo on desktop, the centre of the mobile tab bar), so the coach is reachable
 * from every tab without a floating button covering the page.
 */
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

  return createPortal(
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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent" />
            <div className="relative mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden="true" />

            <Suspense fallback={<AILoading />}>
              <UttarAI onClose={close} />
            </Suspense>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
