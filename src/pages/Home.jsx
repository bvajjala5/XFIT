import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcStreak, localDateStr, getLocalWeekday } from '@/lib/utils'
import Onboarding from './Onboarding'
import { Link } from 'react-router-dom'
import { Pencil, ChevronRight, Play, Circle, CheckCircle2, ClipboardCheck, Zap, Share2, ArrowUp, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import TermsModal from '@/components/shared/TermsModal'
import WeeklyRecap from '@/components/shared/WeeklyRecap'
import NotificationSetup from '@/components/shared/NotificationSetup'
import { shareWorkout, unshareWorkout, isShared } from '@/lib/shareWorkout'
import { seedWorkouts } from '@/lib/seedWorkouts'
import DailyCheckIn from '@/components/home/DailyCheckIn'
import { getDailyQuote } from '@/components/home/DailyQuote'
import { toast } from 'sonner'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Determine which popup should show next after `after` (or from scratch)
function computeNextPopup(after, uid) {
  if (!uid) return null;
  const steps = ['terms', 'notifications'];
  const startIdx = after ? steps.indexOf(after) + 1 : 0;
  for (let i = startIdx; i < steps.length; i++) {
    const s = steps[i];
    if (s === 'terms' && !localStorage.getItem('xfit_terms_agreed_' + uid)) return 'terms';
    if (s === 'recap') {
      const today = new Date();
      if (today.getDay() === 0) {
        const thisWeek = `${today.getFullYear()}-W${Math.ceil(today.getDate()/7)}`;
        if (localStorage.getItem('xfit_recap_shown') !== thisWeek) return 'recap';
      }
    }
    if (s === 'notifications') {
      if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('xfit_notif_dismissed_' + uid)) return 'notifications';
    }
  }
  return null;
}

export default function Home() {
  const { user, userDoc, refreshUserDoc } = useAuth()
  const qc = useQueryClient()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [sharingId, setSharingId] = useState(null)
  const [currentPopup, setCurrentPopup] = useState(null)
  const [manualCheckin, setManualCheckin] = useState(false)
  // Gentle one-time-per-day arrow pointing at the check-in button; fades after a few seconds.
  const [showHint, setShowHint] = useState(false)
  useEffect(() => {
    if (!user?.uid) return
    let t
    try {
      const today = localDateStr()
      if (localStorage.getItem('xfit_checkin_date') === today || localStorage.getItem('xfit_checkin_hint_date') === today) return
      localStorage.setItem('xfit_checkin_hint_date', today)
      setShowHint(true)
      t = setTimeout(() => setShowHint(false), 8000)
    } catch (e) {}
    return () => clearTimeout(t)
  }, [user?.uid])

  // Initialize state machine once user is known
  useEffect(() => {
    if (user?.uid) setCurrentPopup(computeNextPopup(null, user.uid));
  }, [user?.uid]);

  const advancePopup = (from) => setCurrentPopup(computeNextPopup(from, user?.uid));

  async function handleShare(w) {
    if (!user) return
    setSharingId(w.id)
    try {
      const already = await isShared(w.id)
      if (already) {
        await unshareWorkout(w.id)
        toast.success('Workout removed from community')
      } else {
        const name = userDoc?.full_name || user.displayName || 'Anonymous'
        await shareWorkout(user.uid, name, w)
        toast.success('Workout shared with the community')
      }
    } catch (err) {
      toast.error('Could not share workout')
    } finally {
      setSharingId(null)
    }
  }

  useEffect(() => {
    if (userDoc && userDoc.onboarding_complete === false) {
      const agreed = localStorage.getItem('xfit_terms_agreed_' + user?.uid);
      if (agreed) {
        setShowOnboarding(true);
      } else {
        // Wait for terms to be agreed then show onboarding
        const handler = () => setShowOnboarding(true);
        window.addEventListener('terms_agreed', handler, { once: true });
      }
    }
    seedWorkouts(user?.uid)
  }, [userDoc])

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'workouts'))
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(w => w.id !== 'locked-in')
    },
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['workout-logs', user?.uid],
    queryFn: async () => {
      if (!user) return []
      const q = query(collection(db, 'users', user.uid, 'workouts'), orderBy('completedAt', 'desc'), limit(100))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    },
    enabled: !!user,
  })

  const { data: customWorkouts = [] } = useQuery({
    queryKey: ['custom-workouts', user?.uid],
    queryFn: async () => {
      if (!user) return []
      const snap = await getDocs(collection(db, 'users', user.uid, 'customWorkouts'))
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    },
    enabled: !!user,
  })

  const { data: schedule = {} } = useQuery({
    queryKey: ['schedule', user?.uid],
    queryFn: async () => {
      if (!user) return {}
      const snap = await getDocs(collection(db, 'users', user.uid, 'schedule'))
      const map = {}
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() } })
      return map
    },
    enabled: !!user,
  })

  if (showOnboarding) {
    return <Onboarding onComplete={async () => { setShowOnboarding(false); await refreshUserDoc() }} />
  }

  const firstName = userDoc?.full_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'there'
  const streak = calcStreak(logs)

  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const weekLogs = logs.filter(l => {
    const d = new Date(l.completedAt?.toDate?.() || l.completedAt || 0)
    return d >= weekAgo
  })
  const weekWorkouts = weekLogs.length
  const weekMinutes = Math.round(weekLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60)
  const weekCalories = weekLogs.reduce((s, l) => s + (l.calories_burned || 0), 0)

  const today = getLocalWeekday()
  const rawToday = schedule[today]
  const todaySchedule = rawToday?.workout_id === 'locked-in' ? null : rawToday   // 'Locked In' was removed
  const hasAnyPlan = Object.values(schedule).some((e) => e && e.workout_id !== 'locked-in')
  const todayStr = localDateStr()
  const todayLogged = logs.some(l => {
    const d = new Date(l.completedAt?.toDate?.() || l.completedAt || 0)
    return localDateStr(d) === todayStr
  })

  const recommended = workouts.find(w => userDoc?.preferred_types?.includes(w.type)) || workouts[0]

  const quote = getDailyQuote()
  const goalWorkouts = Number(localStorage.getItem('xfit_goals_workouts_per_week')) || 7
  const goalMinutes = Number(localStorage.getItem('xfit_goals_weekly_minutes')) || 150
  const goalCalories = Number(localStorage.getItem('xfit_goals_weekly_calories')) || 2000
  const scheduled = todaySchedule && !todaySchedule.is_rest_day ? todaySchedule : null
  const scheduledLink = scheduled ? (scheduled.is_custom ? `/player/custom/${scheduled.workout_id}` : `/player/${scheduled.workout_id}`) : null
  const todayText = todayLogged
    ? 'Workout done. Rest up and recover.'
    : scheduled ? `${scheduled.workout_title} · ${scheduled.workout_duration} min`
    : todaySchedule?.is_rest_day ? 'Rest day. Recovery counts.'
    : 'Your day is ready when you are.'

  const cardCls = 'bg-card/75 backdrop-blur-md border border-border/50 rounded-3xl'
  const fmt = (n) => n.toLocaleString()
  const durationOf = (w) => { try { const v = localStorage.getItem('xfit_total_duration_' + w.id); if (v) return v } catch (e) {} return w.duration }

  return (
    <div className="relative z-10 max-w-2xl mx-auto pb-28 px-4">
      <TermsModal userId={user?.uid} onDismiss={() => advancePopup('terms')} />
      <DailyCheckIn userId={user?.uid} open={manualCheckin} onDismiss={() => setManualCheckin(false)} />
      <WeeklyRecap logs={logs} />
      <NotificationSetup userId={user?.uid} open={currentPopup === 'notifications'} onDismiss={() => advancePopup('notifications')} />

      {/* Greeting + quote */}
      <motion.header initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="pt-8 pb-5 flex items-end justify-between gap-5">
        <div className="min-w-0 shrink-0 max-w-[48%]">
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-3xl font-extrabold tracking-tight truncate">{firstName}</h1>
        </div>
        <figure className="min-w-0 text-right bg-card/45 backdrop-blur-md rounded-2xl px-3 py-2 mb-1">
          <blockquote className="text-xs leading-snug text-muted-foreground italic line-clamp-3">“{quote.text}”</blockquote>
          {quote.author !== 'Unknown' && <figcaption className="text-[10px] text-muted-foreground/70 mt-1">{quote.author}</figcaption>}
        </figure>
      </motion.header>

      <div className="space-y-4">
        {/* Today */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${cardCls} px-5 py-4 flex items-center gap-3`}>
          {todayLogged
            ? <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
            : <Circle className="w-6 h-6 text-muted-foreground shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Today</p>
            <p className="text-sm text-muted-foreground leading-snug">{todayText}</p>
            {!hasAnyPlan && !todayLogged && <Link to="/plan" className="inline-block text-sm text-primary mt-1">Set up your weekly split</Link>}
          </div>
          {scheduled && !todayLogged && (
            <Link to={scheduledLink} aria-label={`Start ${scheduled.workout_title}`}
              className="w-11 h-11 rounded-full primary-gradient flex items-center justify-center shrink-0 active:scale-95 transition-transform">
              <Play className="w-4 h-4 text-white fill-white" />
            </Link>
          )}
          <div className="relative shrink-0">
            <button onClick={() => { setShowHint(false); setManualCheckin(true) }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground min-h-[44px]">
              <ClipboardCheck className="w-5 h-5" /> <span>Check-in</span>
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}
                  className="absolute z-20 left-1/2 -translate-x-1/2 top-full flex flex-col items-center pointer-events-none" aria-hidden="true">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} className="flex flex-col items-center">
                    <ArrowUp className="w-6 h-6 text-primary" strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold text-primary whitespace-nowrap mt-0.5">Daily check-in</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* This week */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`${cardCls} p-5`}>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-semibold">This week</h2>
            <span className="text-sm text-muted-foreground">{streak > 0 ? `${streak} day streak` : 'Last 7 days'}</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {[
              ['Workouts', weekWorkouts, goalWorkouts],
              ['Minutes', weekMinutes, goalMinutes],
              ['Calories', weekCalories, goalCalories],
            ].map(([label, val, goal], i) => (
              <div key={label} className={i === 0 ? 'pr-4' : 'px-4'}>
                <p className="text-3xl font-bold tabular-nums leading-none">{fmt(val)}</p>
                <p className="text-sm text-muted-foreground mt-2">{label}</p>
                <div className="h-1.5 rounded-full bg-secondary mt-3 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (val / goal) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">of {fmt(goal)}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Start */}
        {(customWorkouts.some((w) => !w.is_split_template) || recommended) && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${cardCls} overflow-hidden`}>
            <div className="flex items-center justify-between px-5 pt-4 pb-1">
              <h2 className="font-semibold">Start a workout</h2>
              <Link to="/workouts" className="text-sm text-primary flex items-center min-h-[44px]">All <ChevronRight className="w-4 h-4" /></Link>
            </div>
            <ul className="divide-y divide-border/40">
              {customWorkouts.filter((w) => !w.is_split_template).slice(0, 3).map((w) => (
                <li key={w.id} className="flex items-center gap-1 pr-3 hover:bg-secondary/40 transition-colors">
                  <Link to={`/player/custom/${w.id}`} className="flex-1 min-w-0 flex items-center gap-3 pl-5 py-3 min-h-[56px]">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground">Mine · {(() => { try { const v = localStorage.getItem('xfit_total_duration_' + w.id); if (v) return v } catch (e) {} return w.duration || w.estimated_duration || '—' })()} min · {w.exercises?.length || 0} exercises</p>
                    </div>
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <button onClick={() => handleShare(w)} disabled={sharingId === w.id} aria-label="Share with community"
                    className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {recommended && (
                <li><Link to={`/workouts/${recommended.id}`} className="flex items-center gap-3 px-5 py-3 min-h-[56px] hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{recommended.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">Suggested · {recommended.type?.replace('_', ' ')} · {durationOf(recommended)} min</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link></li>
              )}
            </ul>
          </motion.section>
        )}

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          {[['/plan', CalendarDays, 'Plan'], ['/builder', Pencil, 'Build']].map(([to, Icon, label]) => (
            <Link key={to} to={to} className={`${cardCls} px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
          <Link to="/run" className={`${cardCls} px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform bg-primary/10 border-primary/20`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-primary">Run Workout</span>
                <span className="text-xs text-muted-foreground">GPS Tracking & Pace</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-primary" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
