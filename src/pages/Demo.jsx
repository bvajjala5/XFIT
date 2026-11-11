import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Dumbbell, HeartPulse, Home, RotateCcw, Sparkles, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import BrandMark from '@/components/brand/BrandMark'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import useAutoTheme from '@/hooks/useAutoTheme'
import usePageMeta from '@/hooks/usePageMeta'
import { useAuth } from '@/lib/AuthContext'
import { DashboardMock, DemoFrame, HealthMock, PlanMock, WorkoutMock } from '@/components/landing/AppMocks'

const TABS = [
  {
    key: 'today',
    label: 'Today',
    icon: Home,
    title: 'Your daily home screen',
    copy: 'Open the app and the next step is already chosen. Today’s session, weekly progress, and your streak live in one calm view.',
    bullets: [
      'Today’s workout is picked for you',
      'Weekly progress and streak at a glance',
      'Tap the play button to mark the sample workout done',
    ],
  },
  {
    key: 'plan',
    label: 'Plan',
    icon: CalendarDays,
    title: 'A week you can follow',
    copy: 'Set a split once, then move a day when life happens. The rest of the week reflows instead of falling apart.',
    bullets: [
      'Start from a preset or build your own split',
      'Select any day to see the session',
      'Rest days are part of the plan, not a failure',
    ],
  },
  {
    key: 'health',
    label: 'Health',
    icon: HeartPulse,
    title: 'Food, sleep, and recovery',
    copy: 'Your training only makes sense next to the rest of your day. Log meals, water, sleep, steps, and weight in the same place.',
    bullets: [
      'Track meals, calories, and macros',
      'See sleep, steps, heart rate, and weight together',
      'Try the water buttons to add or remove a glass',
    ],
  },
  {
    key: 'train',
    label: 'Train',
    icon: Dumbbell,
    title: 'A coach in your pocket',
    copy: 'The workout player keeps the timer, sets, rest, and form cues on screen so you can focus on the rep in front of you.',
    bullets: [
      'Timers, sets, and rest built in',
      'Form cues while you train',
      'Full-screen and thumb-friendly on mobile',
    ],
  },
]

export default function Demo() {
  useAutoTheme()
  usePageMeta({
    title: 'Try the Uttar Fitness demo — no account needed',
    description: 'Tap through a live demo of Uttar Fitness: today’s workout, the weekly plan, health tracking, and the workout player. Nothing is saved until you sign in.',
    path: '/demo',
  })
  const { user } = useAuth()
  const [tab, setTab] = useState('today')
  const [workoutDone, setWorkoutDone] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [water, setWater] = useState(5)
  const tabRefs = useRef({})

  const active = TABS.find((item) => item.key === tab) ?? TABS[0]
  const ActiveIcon = active.icon

  const selectTab = (key) => setTab(key)

  const handleTabKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.key === tab)
    const next = event.key === 'ArrowRight'
      ? (index + 1) % TABS.length
      : (index - 1 + TABS.length) % TABS.length
    const nextKey = TABS[next].key
    setTab(nextKey)
    tabRefs.current[nextKey]?.focus()
  }

  const toggleWorkout = () => {
    const next = !workoutDone
    setWorkoutDone(next)
    toast[next ? 'success' : 'message'](next ? 'Sample workout complete. Nice work.' : 'Sample workout reopened.')
  }

  const resetDemo = () => {
    setTab('today')
    setWorkoutDone(false)
    setSelectedDay('Mon')
    setWater(5)
    toast.message('Demo reset. Nothing was saved.')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Back to the Uttar Fitness overview">
            <BrandMark className="h-9 w-9 rounded-xl" emblemClassName="w-6" />
            <span className="text-sm font-black tracking-tight">Uttar Fitness</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Overview</span>
            </Link>
            {user
              ? <Link to="/home" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90">Dashboard</Link>
              : <Link to="/login" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90">Sign in</Link>}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-primary" /> Live demo · nothing is saved
          </span>
          <h1 className="mt-5 text-balance text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl">
            Take the app for a spin.
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tap through a sample day. Complete a workout, switch training days, and log a glass of water. Sign in only when you want to keep your own data.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div>
            <div
              role="tablist"
              aria-label="Demo screens"
              onKeyDown={handleTabKeyDown}
              className="mb-3 flex gap-1 rounded-2xl border border-border/50 bg-card/60 p-1 backdrop-blur-md"
            >
              {TABS.map(({ key, label, icon: Icon }) => {
                const selected = key === tab
                return (
                  <button
                    key={key}
                    ref={(node) => { tabRefs.current[key] = node }}
                    type="button"
                    role="tab"
                    id={`demo-tab-${key}`}
                    aria-selected={selected}
                    aria-controls={selected ? `demo-panel-${key}` : undefined}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:text-sm ${selected ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>

            <DemoFrame>
              <div
                role="tabpanel"
                id={`demo-panel-${tab}`}
                aria-labelledby={`demo-tab-${tab}`}
                tabIndex={0}
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {tab === 'today' && <DashboardMock done={workoutDone} onToggleDone={toggleWorkout} />}
                {tab === 'plan' && <PlanMock selected={selectedDay} onSelect={setSelectedDay} />}
                {tab === 'health' && <HealthMock water={water} onWater={(delta) => setWater((value) => Math.max(0, Math.min(8, value + delta)))} />}
                {tab === 'train' && <WorkoutMock />}
              </div>
            </DemoFrame>

            <div className="mt-3 flex flex-col items-center justify-between gap-2 px-1 text-xs text-muted-foreground sm:flex-row">
              <p>Sample data only. Nothing is written to an account.</p>
              <button
                type="button"
                onClick={resetDemo}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <RotateCcw className="h-3 w-3" /> Reset demo
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-border/50 bg-card/60 p-5 backdrop-blur-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ActiveIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">What you&rsquo;re seeing</p>
            <h2 className="mt-2 text-lg font-black leading-tight">{active.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.copy}</p>

            <ul className="mt-4 space-y-2">
              {active.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-sm font-bold">Like what you see?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {user
                  ? 'You’re signed in, so your real dashboard is waiting.'
                  : 'Create a free account and the demo is replaced by your own week.'}
              </p>
              {user ? (
                <Link to="/home" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90">
                  Back to my dashboard
                </Link>
              ) : (
                <GoogleSignInButton className="mt-3" label="Continue with Google" variant="primary" />
              )}
            </div>

            <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to the overview
            </Link>
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] text-muted-foreground sm:flex-row sm:px-6">
          <p>Demo mode · Uttar Fitness</p>
          <nav aria-label="Demo footer" className="flex items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
