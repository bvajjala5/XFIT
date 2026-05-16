import React, { useState } from 'react'
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">🏃 Run Tracker</h1>
        <p className="text-muted-foreground text-sm mt-0.5">GPS tracking, pace, splits & more</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <RunSummary summary={summary} userId={user?.uid} onClose={handleClose} />
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RunTracker onComplete={handleComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
