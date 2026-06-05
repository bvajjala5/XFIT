import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcStreak, localDateStr, getLocalWeekday } from '@/lib/utils'
import WorkoutCard from '@/components/shared/WorkoutCard'
import GlassCard from '@/components/shared/GlassCard'
import Onboarding from './Onboarding'
import { Link } from 'react-router-dom'
import { Pencil, ChevronRight, Flame, Calendar, Clock, Play, CheckCircle2, Dumbbell, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { seedWorkouts } from '@/lib/seedWorkouts'
import DailyCheckIn from '@/components/home/DailyCheckIn'
import WaterTracker from '@/components/home/WaterTracker'
import DailyGoals from '@/components/home/DailyGoals'
import DailyQuote from '@/components/home/DailyQuote'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotiEmoji() {
  const h = new Date().getHours()
  if (h < 12) return '☀️'
  if (h < 17) return '💪'
  return '🔥'
}

// Compact ring for the stats row
function StatRing({ value, max, color, label, display }) {
  const pct = Math.min((value / max) * 100, 100)
  const r = 22, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-secondary" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold leading-none">{display}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function Home() {
  const { user, userDoc, refreshUserDoc } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (userDoc && userDoc.onboarding_complete === false) setShowOnboarding(true)
    seedWorkouts()
  }, [userDoc])

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'workouts'))
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
  const todaySchedule = schedule[today]
  const todayStr = localDateStr()
  const todayLogged = logs.some(l => {
    const d = new Date(l.completedAt?.toDate?.() || l.completedAt || 0)
    return localDateStr(d) === todayStr
  })

  const recommended = workouts.find(w => userDoc?.preferred_types?.includes(w.type)) || workouts[0]
  const lockedIn = workouts.find(w => w.id === 'locked-in')

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <DailyCheckIn userId={user?.uid} />

      {/* ── HERO HEADER ── */}
      <div className="relative px-5 pt-8 pb-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl primary-gradient pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-muted-foreground text-sm font-medium">{getMotiEmoji()} {getGreeting()}</p>
          <h1 className="text-3xl font-black mt-0.5 tracking-tight">{firstName}</h1>
        </motion.div>

        {/* Streak pill */}
        {streak > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="absolute top-8 right-5 flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5" /> {streak} day streak
          </motion.div>
        )}
      </div>

      <div className="px-4 space-y-4">

        {/* ── TODAY BANNER ── */}
        {todayLogged ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3.5">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-300">Workout done for today!</p>
              <p className="text-xs text-green-400/70 mt-0.5">Great work — rest up and recover 💚</p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-primary/8 border border-primary/15 rounded-2xl px-4 py-3.5">
            <Dumbbell className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Ready to move?</p>
              <p className="text-xs text-muted-foreground mt-0.5">You haven't logged a workout yet today</p>
            </div>
            <Link to="/workouts">
              <button className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors">
                Browse
              </button>
            </Link>
          </motion.div>
        )}

        {/* ── WEEKLY STATS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-card border border-border/60 rounded-3xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">This week</p>
            <div className="flex items-center justify-around">
              <StatRing value={weekWorkouts} max={5} color="hsl(var(--primary))" label="Workouts" display={`${weekWorkouts}/5`} />
              <StatRing value={weekMinutes} max={150} color="#4ade80" label="Minutes" display={`${weekMinutes}m`} />
              <StatRing value={weekCalories} max={2000} color="#fb923c" label="Calories" display={weekCalories} />
            </div>

            {/* 14-day streak dots */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">Last 14 days</span>
                <span className="text-[10px] text-orange-400 font-semibold">{streak} day streak 🔥</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 14 }, (_, i) => {
                  const d = new Date(Date.now() - (13 - i) * 86400000)
                  const has = logs.some(l => localDateStr(new Date(l.completedAt?.toDate?.() || l.completedAt || 0)) === localDateStr(d))
                  const isToday = i === 13
                  return (
                    <div key={i} title={d.toLocaleDateString()}
                      className={`flex-1 h-2 rounded-full transition-all ${has ? 'bg-orange-400' : isToday ? 'bg-primary/30 ring-1 ring-primary/50' : 'bg-secondary'}`} />
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TODAY'S SCHEDULED WORKOUT ── */}
        {todaySchedule && !todaySchedule.is_rest_day && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-card border border-border/60 rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Scheduled today</p>
                <p className="font-bold truncate mt-0.5">{todaySchedule.workout_title}</p>
                <p className="text-xs text-muted-foreground">{todaySchedule.workout_duration} min · {todaySchedule.workout_difficulty}</p>
              </div>
              {todayLogged ? (
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
              ) : (
                <Link to={todaySchedule.is_custom ? `/player/custom/${todaySchedule.workout_id}` : `/player/${todaySchedule.workout_id}`}>
                  <button className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center shadow-md active:scale-95 transition-transform">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* ── LOCKED IN FEATURED CARD ── */}
        {lockedIn && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 px-1">Featured Workout</p>
            <Link to={`/workouts/${lockedIn.id}`}>
              <div className="relative rounded-3xl overflow-hidden h-52 group">
                <img
                  src={lockedIn.image_url || 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80'}
                  alt={lockedIn.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Signature Workout</span>
                      <h3 className="text-xl font-black text-white mt-0.5">{lockedIn.title}</h3>
                      <p className="text-white/60 text-xs mt-1">{(() => {
                        try {
                          const saved = localStorage.getItem('xfit_total_duration_' + lockedIn.id);
                          if (saved) return saved + ' min';
                        } catch(e) {}
                        return lockedIn.duration + ' min';
                      })()} · {lockedIn.trainer}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/builder">
              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[0.98]">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Build</p>
                  <p className="text-[10px] text-muted-foreground">Custom workout</p>
                </div>
              </div>
            </Link>
            <Link to="/run">
              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3 hover:border-green-500/30 hover:bg-green-500/5 transition-all active:scale-[0.98]">
                <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Run</p>
                  <p className="text-[10px] text-muted-foreground">GPS tracker</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ── MY CUSTOM WORKOUTS ── */}
        {customWorkouts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 px-1">My Workouts</p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {customWorkouts.map(w => (
                <div key={w.id} className="flex-shrink-0 bg-card border border-border/60 rounded-2xl p-4 w-44">
                  <p className="font-semibold text-sm truncate">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(() => {
                    try {
                      const saved = localStorage.getItem('xfit_total_duration_' + w.id);
                      if (saved) return saved;
                    } catch(e) {}
                    return w.duration || w.estimated_duration || '—';
                  })()} min · {w.exercises?.length || 0} exercises</p>
                  <Link to={`/player/custom/${w.id}`}>
                    <button className="mt-3 w-full h-8 rounded-xl primary-gradient text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <Play className="w-3 h-3 fill-white" /> Start
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── DAILY QUOTE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <DailyQuote />
        </motion.div>

        {/* ── WATER + GOALS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <WaterTracker />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <DailyGoals />
        </motion.div>

        {/* ── WORKOUT LIBRARY ── */}
        {workouts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Browse Workouts</p>
              <Link to="/workouts" className="text-xs text-primary font-semibold">See all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {workouts.filter(w => w.id !== 'locked-in').slice(0, 4).map((w, i) => (
                <WorkoutCard key={w.id} workout={w} index={i} />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
