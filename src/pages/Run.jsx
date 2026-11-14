import { useState } from 'react';
import { Footprints } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import RunTracker from '@/components/run/RunTracker'
import RunSummary from '@/components/run/RunSummary'
import { motion, AnimatePresence } from 'framer-motion'

export default function Run() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)

  function handleComplete(runSummary) {
    setSummary(runSummary)
  }

  function handleClose() {
    setSummary(null)
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8 max-w-2xl mx-auto w-full pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white drop-shadow-md">
            <Footprints className="w-6 h-6 text-primary" /> Run Tracker
          </h1>
          <p className="text-white/70 text-sm mt-0.5 drop-shadow-sm">GPS tracking, pace, splits & more</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8 bg-background/90 backdrop-blur-md">
            <div className="w-full max-w-md">
              <RunSummary summary={summary} userId={user?.uid} onClose={handleClose} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full relative">
            <RunTracker onComplete={handleComplete} fullScreen={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
