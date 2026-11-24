import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistance, formatPace, normalizeDistanceUnit } from '@/lib/distanceUnits'
import { SAMPLE_CSV } from '@/lib/csvImport'
import {
  MAX_IMPORT_FILES,
  SAMPLE_GPX,
  SAMPLE_TCX,
  parseActivityFiles,
} from '@/lib/activityFiles'
import { saveRun } from '@/lib/runSave'
import useFocusTrap from '@/hooks/useFocusTrap'
import { toast } from 'sonner'

const SAMPLES = [
  { label: 'CSV', name: 'uttar-runs-sample.csv', type: 'text/csv', text: SAMPLE_CSV },
  { label: 'GPX', name: 'uttar-run-sample.gpx', type: 'application/gpx+xml', text: SAMPLE_GPX },
  { label: 'TCX', name: 'uttar-run-sample.tcx', type: 'application/tcx+xml', text: SAMPLE_TCX },
]

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60)
  return `${mins}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function CsvImportDialog({ open, onClose, userId, unit = 'miles' }) {
  const contentRef = useRef(null)
  useFocusTrap(contentRef, open, onClose)

  const [files, setFiles] = useState([])
  const [selectedUnit, setSelectedUnit] = useState(() => normalizeDistanceUnit(unit))
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const result = useMemo(
    () => (files.length ? parseActivityFiles(files, { unit: selectedUnit }) : null),
    [files, selectedUnit],
  )

  function reset() {
    setFiles([])
    setDragging(false)
    setBusy(false)
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function readFiles(fileList) {
    const supported = Array.from(fileList || []).filter((file) => /\.(csv|gpx|tcx)$/i.test(file.name))
    if (supported.length === 0) {
      toast.error('Choose a CSV, GPX, or TCX file.')
      return
    }
    try {
      const loaded = await Promise.all(supported.map(async (file) => ({
        name: file.name,
        text: await file.text(),
      })))
      setFiles((previous) => [...previous, ...loaded])
    } catch {
      toast.error('Could not read those files. Try again.')
    }
  }

  async function handleFiles(event) {
    await readFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (!busy) readFiles(event.dataTransfer?.files)
  }

  function removeFile(index) {
    setFiles((previous) => previous.filter((_, position) => position !== index))
  }

  async function handleImport() {
    if (!userId) { toast.error('Sign in before importing runs.'); return }
    if (!result?.rows?.length) return
    setBusy(true)
    let saved = 0
    let queued = 0
    let failed = 0
    try {
      for (const row of result.rows) {
        try {
          const outcome = await saveRun(userId, row, { id: row.id })
          if (outcome.queued) queued += 1
          else saved += 1
        } catch {
          failed += 1
        }
      }
      if (failed === 0) {
        toast.success(`Imported ${saved} run${saved === 1 ? '' : 's'}${queued ? ` (${queued} saved on this device)` : ''}.`)
        reset()
        onClose()
      } else {
        toast.error(`Imported ${saved + queued} runs; ${failed} failed. Nothing else was changed.`)
      }
    } finally {
      setBusy(false)
    }
  }

  function downloadSample(sample) {
    const url = URL.createObjectURL(new Blob([sample.text], { type: sample.type }))
    const link = document.createElement('a')
    link.href = url
    link.download = sample.name
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {open && [
        <motion.div
          key="csv-import-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        />,
        <motion.div
          key="csv-import-panel"
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-label="Import runs from a file"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/60 bg-card p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> Import runs
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Drop one or more files. They are checked here on your device, then saved to your workout history.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close import dialog"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Choose or drop run files; press Enter to browse"
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  document.getElementById('csv-run-file')?.click()
                }
              }}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={(event) => {
                event.preventDefault()
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
              }}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed p-2 transition-colors ${
                dragging ? 'border-primary bg-primary/10' : 'border-border/60'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="csv-run-file"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose files
                </label>
                <input
                  id="csv-run-file"
                  type="file"
                  multiple
                  accept=".csv,.gpx,.tcx,text/csv,application/gpx+xml,application/tcx+xml"
                  onChange={handleFiles}
                  className="sr-only"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Samples</span>
                {SAMPLES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => downloadSample(sample)}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Download className="w-3 h-3" /> {sample.label}
                  </button>
                ))}
              </div>
              {dragging && (
                <p className="pt-2 text-center text-[11px] font-semibold text-primary">Drop CSV, GPX, or TCX files here</p>
              )}
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {files.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-lg bg-secondary/50 py-1 pl-2 pr-1 text-[10px] font-semibold"
                  >
                    <span className="max-w-[10rem] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={busy}
                      aria-label={`Remove ${file.name}`}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {(!result || result.formats.includes('csv')) && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Distances in CSV are</p>
                <div className="flex gap-1.5 rounded-xl bg-secondary/50 p-1">
                  {['miles', 'kilometers'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedUnit(option)}
                      aria-pressed={selectedUnit === option}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-colors ${
                        selectedUnit === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                {result.formats.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {result.formats.map((format) => format.toUpperCase()).join(' + ')}
                  </p>
                )}
                {result.rows.length > 0 && (
                  <div className="max-h-44 overflow-auto rounded-xl border border-border/60">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-secondary/70 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1.5">Date</th>
                          <th className="px-2 py-1.5">Distance</th>
                          <th className="px-2 py-1.5">Time</th>
                          <th className="px-2 py-1.5">Pace</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.slice(0, 8).map((row) => (
                          <tr key={row.id} className="border-t border-border/40">
                            <td className="px-2 py-1.5">{formatDate(row.completedAt)}</td>
                            <td className="px-2 py-1.5">{formatDistance(row.distance, row.distance_unit)} {row.distance_unit === 'miles' ? 'mi' : 'km'}</td>
                            <td className="px-2 py-1.5">{formatClock(row.elapsed)}</td>
                            <td className="px-2 py-1.5">{formatPace(row.elapsed, row.distance, row.distance_unit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {result.rows.length} run{result.rows.length === 1 ? '' : 's'} ready{result.skipped ? ` · ${result.skipped} skipped` : ''}
                </p>
                {result.errors.map((error) => (
                  <p key={error} className="text-[11px] text-amber-500">{error}</p>
                ))}
              </div>
            )}

            {!result && (
              <p className="rounded-xl bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                Strava and device exports work: <span className="font-semibold text-foreground">CSV, GPX, or TCX</span>. You can drop up to {MAX_IMPORT_FILES} files at once. For CSV use columns <span className="font-semibold text-foreground">date, distance, duration</span>, plus optional calories, steps, and name. Duration accepts <span className="font-semibold text-foreground">hh:mm:ss</span> or minutes. Re-importing the same activity will not create duplicates.
              </p>
            )}

            <Button
              className="w-full rounded-xl"
              disabled={!result?.rows?.length || busy}
              onClick={handleImport}
            >
              {busy ? 'Importing…' : `Import ${result?.rows?.length || ''} run${result?.rows?.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </motion.div>,
      ]}
    </AnimatePresence>
  )
}
