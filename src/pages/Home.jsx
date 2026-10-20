import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcStreak, localDateStr } from '@/lib/utils'
import Onboarding from './Onboarding'
import { Flame, CheckCircle2, ClipboardCheck } from 'lucide-react'
import TermsModal from '@/components/shared/TermsModal'
import { seedWorkouts } from '@/lib/seedWorkouts'
import DailyCheckIn from '@/components/home/DailyCheckIn'
import { isCountedWorkout } from '@/lib/workoutDuration'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Determine which popup should show next after `after` (or from scratch)
export default function Home() {
  const { user, userDoc, refreshUserDoc } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkinOpen, setCheckinOpen] = useState(false)

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

  if (showOnboarding) {
    return <Onboarding onComplete={async () => { setShowOnboarding(false); await refreshUserDoc() }} />
  }

  const firstName = userDoc?.full_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'there'
  const completedLogs = logs.filter(isCountedWorkout)
  const streak = calcStreak(completedLogs)
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const weekLogs = completedLogs.filter(log => new Date(log.completedAt?.toDate?.() || log.completedAt || 0) >= weekAgo)
  const weekWorkouts = weekLogs.length
  const weekMinutes = Math.round(weekLogs.reduce((total, log) => total + (log.duration_seconds || 0), 0) / 60)
  const weekCalories = weekLogs.reduce((total, log) => total + (log.calories_burned || 0), 0)
  const todayLogged = completedLogs.some(log => localDateStr(new Date(log.completedAt?.toDate?.() || log.completedAt || 0)) === localDateStr())
  const weeklyGoals = {
    workouts: Number(localStorage.getItem('xfit_goals_workouts_per_week')) || 7,
    minutes: Number(localStorage.getItem('xfit_goals_weekly_minutes')) || 150,
    calories: Number(localStorage.getItem('xfit_goals_weekly_calories')) || 2000,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-6">
      <TermsModal userId={user?.uid} />
      <DailyCheckIn userId={user?.uid} open={checkinOpen} onDismiss={() => setCheckinOpen(false)} />

      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{firstName}</h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground" aria-label={`${streak} day streak`}>
            <Flame className="w-4 h-4 text-primary" /> {streak} day streak
          </div>
        )}
      </header>

      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="today-title">
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${todayLogged ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h2 id="today-title" className="text-sm font-medium">Today</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {todayLogged ? 'You have logged activity today.' : 'Your day is ready when you are.'}
            </p>
          </div>
          <button type="button" onClick={() => setCheckinOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ClipboardCheck className="h-4 w-4" /> Daily check-in
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="week-title">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="week-title" className="text-sm font-medium">This week</h2>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-border">
          {[
            { label: 'Workouts', value: weekWorkouts, goal: weeklyGoals.workouts },
            { label: 'Minutes', value: weekMinutes, goal: weeklyGoals.minutes },
            { label: 'Calories', value: weekCalories, goal: weeklyGoals.calories },
          ].map(item => (
            <div key={item.label} className="px-3 first:pl-0 last:pr-0">
              <p className="text-xl font-semibold tabular-nums">{item.value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
              <div className="mt-3 h-1 rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.value / item.goal * 100, 100)}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">of {item.goal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
