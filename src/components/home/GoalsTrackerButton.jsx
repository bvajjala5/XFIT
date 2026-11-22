import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle2, Circle, Trash2, Plus, Zap, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import useFocusTrap from '@/hooks/useFocusTrap'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  GOALS_CHANGED,
  RULE_HINTS,
  inferRule,
  evaluateGoal,
  computeContext,
  computeProgress,
  loadGoals,
  saveGoals,
  addItem,
  removeItem,
  toggleDone,
} from '@/lib/goalsTracker'

const LEVEL_STYLES = {
  empty: { text: 'text-muted-foreground', ring: 'border-border/60', glow: 'rgba(120,120,130,0.35)' },
  red: { text: 'text-red-500', ring: 'border-red-500/60', glow: 'rgba(239,68,68,0.55)' },
  orange: { text: 'text-orange-500', ring: 'border-orange-500/60', glow: 'rgba(249,115,22,0.55)' },
  green: { text: 'text-green-500', ring: 'border-green-500/60', glow: 'rgba(34,197,94,0.55)' },
}

function GoalRow({ item, ctx, onToggle, onDelete }) {
  const rule = inferRule(item.text)
  const auto = !!rule
  const done = evaluateGoal(item, ctx)
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 min-h-[44px] transition-colors ${done ? 'bg-green-500/5' : 'bg-secondary/40'}`}>
      <button type="button" role="checkbox" aria-checked={done}
        onClick={() => onToggle(item.id)} aria-label={done ? `Mark "${item.text}" not done` : `Mark "${item.text}" done`}
        title={auto ? 'Auto-checks from your activity — tap to check it yourself' : undefined}
        className="w-11 h-11 -my-2 -ml-1 shrink-0 flex items-center justify-center text-left rounded-lg hover:bg-foreground/5 active:scale-95 transition-all">
        {done
          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
          : <Circle className={`w-5 h-5 ${auto ? 'text-muted-foreground/60' : 'text-muted-foreground'}`} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug break-words ${done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</p>
        {auto && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Zap className="w-3 h-3 text-primary shrink-0" />
            {RULE_HINTS[inferRule(item.text)]?.hint || 'Auto-checked from your activity'}
          </p>
        )}
      </div>
      <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete goal "${item.text}"`}
        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function GoalsTrackerButton({ logs }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const contentRef = useRef(null)
  useFocusTrap(contentRef, open, () => setOpen(false))

  const ctx = useMemo(() => computeContext(logs), [logs])
  // Latest items for async handlers so rapid mutations can't act on a stale
  // snapshot and overwrite each other (lost-update between persist calls).
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  // A reload triggered by one of our own saves must never clobber state with
  // the pre-write Firestore snapshot (it made added goals vanish and checks
  // revert). savingRef suppresses those reloads; reqIdRef invalidates any
  // load that was already in flight when a save started.
  const savingRef = useRef(false)
  const reqIdRef = useRef(0)
  const progress = useMemo(() => computeProgress(items, ctx), [items, ctx])
  const level = LEVEL_STYLES[progress.level] || LEVEL_STYLES.empty
  const liveRule = inferRule(text)
  const animating = progress.level === 'red' || progress.level === 'orange' || progress.level === 'green'

  const reload = useCallback(() => {
    const reqId = ++reqIdRef.current
    loadGoals(uid).then((next) => {
      // Only apply the newest load: anything older is stale by definition.
      if (reqId === reqIdRef.current) setItems(Array.isArray(next) ? next : [])
    })
  }, [uid])

  useEffect(() => { reload() }, [uid, reload])
  useEffect(() => {
    const onChange = () => { if (!savingRef.current) reload() }
    window.addEventListener(GOALS_CHANGED, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(GOALS_CHANGED, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [reload])

  const persist = async (next, okMsg) => {
    reqIdRef.current += 1 // drop any in-flight load so it can't revert this save
    savingRef.current = true
    setItems(next)
    setSaving(true)
    try {
      await saveGoals(uid, next)
      if (okMsg) toast.success(okMsg)
    } catch {
      toast.error('Could not save goals')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return
    await persist(addItem(itemsRef.current, clean), 'Goal added')
    setText('')
    inputRef.current?.focus()
  }

  const handleToggle = async (id) => {
    await persist(toggleDone(itemsRef.current, id))
  }

  const handleDelete = async (id) => {
    await persist(removeItem(itemsRef.current, id), 'Goal deleted')
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Goals tracker"
        title={progress.total ? `${progress.done} of ${progress.total} done` : 'Goals tracker'}
        className={`relative w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-card/75 backdrop-blur-md border flex items-center justify-center transition-colors duration-500 ${level.ring} ${level.text}`}
        animate={animating
          ? { boxShadow: [`0 0 0 0px ${level.glow}`, `0 0 0 8px ${level.glow.replace('0.55', '0').replace('0.35', '0')}`], scale: [1, 1.06, 1] }
          : { boxShadow: '0 0 0 0px rgba(0,0,0,0)', scale: 1 }}
        transition={animating ? { duration: 1.8, repeat: Infinity, ease: 'easeOut' } : { duration: 0.2 }}
        whileTap={{ scale: 0.92 }}
      >
        <Target className="w-5 h-5" strokeWidth={2} />
        {progress.total > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-[18px] text-center bg-background border ${level.ring} ${level.text}`}>
            {progress.total - progress.done}
          </span>
        )}
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
              <motion.div
                ref={contentRef}
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-labelledby="goals-tracker-title"
                tabIndex={-1}
                className="w-full sm:max-w-sm bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto focus:outline-none"
                style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 id="goals-tracker-title" className="text-xl font-extrabold tracking-tight">Goals</h2>
                    <p className="text-xs text-muted-foreground">
                      {progress.total ? `${progress.done} of ${progress.total} done` : 'Set daily goals and track them automatically'}
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {progress.total > 0 && (
                  <Progress value={progress.fraction * 100}
                    className={progress.level === 'red' ? '[&>div]:bg-red-500' : progress.level === 'orange' ? '[&>div]:bg-orange-500' : progress.level === 'green' ? '[&>div]:bg-green-500' : ''} />
                )}

                <div className="space-y-1.5 mt-3">
                  {items.length === 0 ? (
                    <div className="text-center py-6">
                      <Target className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No goals yet — add your first one</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <GoalRow key={item.id} item={item} ctx={ctx}
                        onToggle={handleToggle} onDelete={handleDelete} />
                    ))
                  )}
                </div>

                <form onSubmit={handleAdd} className="flex gap-2 pt-2">
                  <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
                    placeholder='Add a goal, e.g. "workout today"'
                    className="text-sm h-10 rounded-xl bg-secondary/50" aria-label="New goal" />
                  <button type="submit" disabled={!text.trim() || saving} aria-label="Add goal"
                    className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
                <AnimatePresence>
                  {liveRule && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[11px] text-muted-foreground flex items-center gap-1 -mt-1">
                      <Zap className="w-3 h-3 text-primary shrink-0" />
                      This goal auto-checks — {RULE_HINTS[liveRule].hint}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
