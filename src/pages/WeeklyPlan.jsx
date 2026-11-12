import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Moon, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchCustomWorkouts, fetchWorkoutLibrary } from '@/lib/workoutCache'
import { useAuth } from '@/lib/AuthContext'
import { getLocalWeekday } from '@/lib/utils'
import { DAYS, PRESETS, TEMPLATES, templateById } from '@/data/splits'
import { applyPreset, ensureTemplate, fetchSchedule, restEntry, saveDay, workoutEntry } from '@/lib/weeklyPlan'
import useFocusTrap from '@/hooks/useFocusTrap'

const card = 'bg-card/75 backdrop-blur-md border border-border/50 rounded-3xl'
const presetWeek = (p) => p.week.map((k) => (k ? TEMPLATES[k].label : 'Rest')).join(' · ')

function PickerSheet({ day, custom, library, onPick, onClose }) {
  const contentRef = useRef(null);
  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useFocusTrap(contentRef, true, onClose);

  const Item = ({ title, sub, onClick, icon }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-1 py-3 min-h-[56px] text-left border-b border-border/30 last:border-0 active:bg-secondary/40">
      {icon}
      <div className="flex-1 min-w-0"><p className="font-medium truncate">{title}</p>{sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}</div>
    </button>
  )
  const Head = ({ children }) => <p className="text-xs uppercase tracking-widest text-muted-foreground mt-5 mb-1">{children}</p>
  const mine = custom.filter((w) => !w.is_split_template)
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="picker-title" ref={contentRef} tabIndex={-1}
        className="w-full sm:max-w-md bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto focus:outline-none"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between">
          <h2 id="picker-title" className="text-lg font-extrabold">{day}</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <Item title="Rest day" sub="Recovery counts" icon={<Moon className="w-5 h-5 text-muted-foreground" />} onClick={() => onPick({ type: 'rest' })} />
        <Head>Split workouts</Head>
        {Object.entries(TEMPLATES).map(([key, t]) => (
          <Item key={key} title={t.title} sub={t.description} onClick={() => onPick({ type: 'template', key })} />
        ))}
        {mine.length > 0 && <Head>My workouts</Head>}
        {mine.map((w) => <Item key={w.id} title={w.name || w.title} sub={`${w.duration || w.estimated_duration || '—'} min`} onClick={() => onPick({ type: 'custom', w })} />)}
        {library.length > 0 && <Head>Library</Head>}
        {library.map((w) => <Item key={w.id} title={w.title} sub={`${w.duration} min · ${w.type}`} onClick={() => onPick({ type: 'library', w })} />)}
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function WeeklyPlan() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.uid
  const today = getLocalWeekday()
  const [pickDay, setPickDay] = useState(null)
  const [pending, setPending] = useState(null)   // preset waiting for "replace?" confirmation
  const [busy, setBusy] = useState(false)

  const { data: schedule = {} } = useQuery({ queryKey: ['schedule', uid], queryFn: () => fetchSchedule(uid), enabled: !!uid })
  const { data: custom = [] } = useQuery({
    queryKey: ['custom-workouts', uid], enabled: !!uid,
    queryFn: () => fetchCustomWorkouts(uid),
  })
  const { data: library = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: fetchWorkoutLibrary,
  })

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['schedule', uid] }), qc.invalidateQueries({ queryKey: ['custom-workouts', uid] })])
  const hasPlan = DAYS.some(([k]) => schedule[k])

  async function run(fn, okMsg) {
    setBusy(true)
    try { await fn(); await refresh(); toast.success(okMsg) }
    catch (e) { console.error(e); toast.error('Could not save. Check your connection and try again.') }
    finally { setBusy(false) }
  }

  const choosePreset = (p) => (hasPlan ? setPending(p) : run(() => applyPreset(uid, p.id), `${p.name} plan is set`))

  async function pick(dayKey, choice) {
    setPickDay(null)
    await run(async () => {
      if (choice.type === 'rest') return saveDay(uid, restEntry(dayKey))
      if (choice.type === 'template') {
        const made = await ensureTemplate(uid, choice.key)
        return saveDay(uid, workoutEntry(dayKey, TEMPLATES[choice.key].label, { ...made, custom: true }))
      }
      if (choice.type === 'custom') {
        const w = choice.w
        return saveDay(uid, workoutEntry(dayKey, w.name || w.title, { id: w.id, title: w.name || w.title, minutes: w.duration || w.estimated_duration || 30, difficulty: w.difficulty, custom: true }))
      }
      const w = choice.w
      return saveDay(uid, workoutEntry(dayKey, w.title, { id: w.id, title: w.title, minutes: w.duration, difficulty: w.difficulty, custom: false }))
    }, 'Day updated')
  }

  const pickedName = pickDay && DAYS.find(([k]) => k === pickDay)[2]

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-28 space-y-5">
      <header className="flex items-center gap-1">
        <Link to="/home" aria-label="Back" className="w-11 h-11 -ml-3 flex items-center justify-center text-muted-foreground"><ChevronLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Weekly plan</h1>
          <p className="text-sm text-muted-foreground">Pick a split, then change any day you like.</p>
        </div>
      </header>

      <section aria-label="Split presets" className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground px-1">Start from a split</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {PRESETS.map((p) => (
            <button key={p.id} disabled={busy} onClick={() => choosePreset(p)}
              className={`${card} shrink-0 w-44 p-4 text-left min-h-[88px] active:scale-[0.98] transition-transform disabled:opacity-50 ${pending?.id === p.id ? 'ring-2 ring-primary' : ''}`}>
              <p className="font-semibold leading-snug">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.sub}</p>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {pending && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`${card} p-4 space-y-3`}>
              <p className="text-sm"><span className="font-semibold">{pending.name} ({pending.sub})</span><br /><span className="text-muted-foreground">{presetWeek(pending)}</span></p>
              <p className="text-sm text-muted-foreground">This replaces your current plan. Your own workouts are not deleted.</p>
              <div className="flex gap-2">
                <button onClick={() => setPending(null)} className="flex-1 min-h-[44px] rounded-xl bg-secondary/60 text-sm">Cancel</button>
                <button onClick={() => { const p = pending; setPending(null); run(() => applyPreset(uid, p.id), `${p.name} plan is set`) }}
                  className="flex-1 min-h-[44px] rounded-xl primary-gradient text-white text-sm font-semibold">Replace plan</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section aria-label="This week" className={`${card} overflow-hidden`}>
        <ul className="divide-y divide-border/40">
          {DAYS.map(([key, short, full]) => {
            const e = schedule[key]
            const isToday = key === today
            const rest = !e || e.is_rest_day
            const tpl = e && templateById(e.workout_id)
            return (
              <li key={key} className={`flex items-center ${isToday ? 'bg-primary/8' : ''}`}>
                <button onClick={() => setPickDay(key)} disabled={busy} className="flex-1 min-w-0 flex items-center gap-4 pl-5 py-3 min-h-[64px] text-left">
                  <span className={`w-9 text-sm font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{short}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block font-semibold truncate ${rest ? 'text-muted-foreground' : ''}`}>{!e ? 'Not set' : rest ? 'Rest' : e.label || e.workout_title}</span>
                    {!rest && <span className="block text-xs text-muted-foreground truncate">{e.workout_title}{e.workout_duration ? ` · ${e.workout_duration} min` : ''}{tpl ? '' : ''}</span>}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
                {!rest && (
                  <Link to={e.is_custom ? `/player/custom/${e.workout_id}` : `/player/${e.workout_id}`} aria-label={`Start ${e.workout_title}`}
                    className="w-11 h-11 mr-3 rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform">
                    <Play className="w-4 h-4 fill-current" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground px-1 flex items-start gap-2"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />Split workouts are saved to My workouts, so you can edit or rebuild them any time. Today's workout shows on your Home screen.</p>

      <AnimatePresence>
        {pickDay && <PickerSheet day={pickedName} custom={custom} library={library} onPick={(c) => pick(pickDay, c)} onClose={() => setPickDay(null)} />}
      </AnimatePresence>
    </div>
  )
}
