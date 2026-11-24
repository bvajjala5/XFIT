import { useState } from 'react';
import { FileSpreadsheet, Footprints } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import RunTracker from '@/components/run/RunTracker'
import RunSummary from '@/components/run/RunSummary'
import CsvImportDialog from '@/components/run/CsvImportDialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function Run() {
  const { user, userData } = useAuth()
  const [searchParams] = useSearchParams()
  const [summary, setSummary] = useState(null)
  const [importOpen, setImportOpen] = useState(() => searchParams.get('import') === '1')
  const distanceUnit = userData?.distance_unit || 'miles'

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
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Import run file
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8 bg-background/90 backdrop-blur-md">
            <div className="w-full max-w-md">
              <RunSummary summary={summary} userId={user?.uid} unit={distanceUnit} onClose={handleClose} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full relative">
            <RunTracker onComplete={handleComplete} fullScreen={true} unit={distanceUnit} />
          </motion.div>
        )}
      </AnimatePresence>

      <CsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        userId={user?.uid}
        unit={distanceUnit}
      />
    </div>
  )
}
