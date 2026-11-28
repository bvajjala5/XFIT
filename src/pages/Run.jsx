import { useCallback, useState } from 'react';
import { Footprints, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAuth } from '@/lib/AuthContext'
import RunTracker from '@/components/run/RunTracker'
import RunSummary from '@/components/run/RunSummary'
import CsvImportDialog from '@/components/run/CsvImportDialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function Run() {
  const { user, userData } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [importOpen, setImportOpen] = useState(() => searchParams.get('import') === '1')
  const [runActive, setRunActive] = useState(false)
  const [exitConfirming, setExitConfirming] = useState(false)
  const distanceUnit = userData?.distance_unit || 'miles'

  // The title belongs to the idle screen. Once a run starts, the map and stats
  // need the whole viewport, so hide it until the tracker resets.
  const handleStatusChange = useCallback((next) => setRunActive(next !== 'idle'), [])

  function handleComplete(runSummary) {
    setSummary(runSummary)
  }

  function handleClose() {
    setSummary(null)
  }

  function leaveRun() {
    setSummary(null)
    setExitConfirming(false)
    // A real navigation from Home, Workouts or Profile returns to that screen.
    // A direct/open-in-new-tab visit has no history entry to go back to.
    if (location.key && location.key !== 'default') navigate(-1)
    else navigate('/home', { replace: true })
  }

  function requestExit() {
    // Idle has nothing to lose, so it closes instantly. A running or finished
    // run gets a confirmation because leaving discards unsaved progress.
    if (!runActive && !summary) {
      leaveRun()
      return
    }
    setExitConfirming(true)
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <AnimatePresence>
        {!runActive && (
          <motion.div key="run-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8 max-w-2xl mx-auto w-full pointer-events-none">
            <div className="pointer-events-auto pr-14">
              <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground drop-shadow-sm">
                <Footprints className="w-6 h-6 text-primary" /> Run Tracker
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">GPS tracking, pace, splits &amp; more</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-4 top-4 z-40 md:right-8 md:top-8">
        <button
          type="button"
          onClick={requestExit}
          aria-label="Close run tracker and go back"
          title="Close and go back"
          className="icon-button h-11 w-11 rounded-2xl border-border/50 bg-card/70 text-foreground shadow-lg backdrop-blur-xl"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8 bg-background/90 backdrop-blur-md">
            <div className="w-full max-w-md">
              <RunSummary summary={summary} userId={user?.uid} unit={distanceUnit} onClose={handleClose} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full relative">
            <RunTracker onComplete={handleComplete} onStatusChange={handleStatusChange} fullScreen={true} unit={distanceUnit} />
          </motion.div>
        )}
      </AnimatePresence>

      <CsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        userId={user?.uid}
        unit={distanceUnit}
      />

      <AlertDialog open={exitConfirming} onOpenChange={setExitConfirming}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave the run tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              {summary
                ? 'This run has not been saved yet. Going back now will discard the summary.'
                : 'Your current run will be discarded and you’ll return to the screen you came from.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{summary ? 'Keep summary' : 'Keep running'}</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={leaveRun}>Leave tracker</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
