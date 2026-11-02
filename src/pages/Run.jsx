import React, { useState } from 'react'
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
    <div className="min-h-screen w-full bg-background flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8 max-w-2xl mx-auto w-full mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Footprints className="w-6 h-6 text-primary" /> Run Tracker</h1>
        <p className="text-muted-foreground text-sm mt-0.5">GPS tracking, pace, splits & more</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 md:p-8 max-w-2xl mx-auto w-full">
            <RunSummary summary={summary} userId={user?.uid} onClose={handleClose} />
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full">
            <RunTracker onComplete={handleComplete} fullScreen={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
