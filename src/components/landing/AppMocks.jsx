import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BarChart2,
  BarChart3,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Home,
  Minus,
  Moon,
  Palette,
  Play,
  Plus,
  Scale,
  Search,
  Settings,
  SkipForward,
  Sparkles,
  Sun,
  Timer,
  TrendingUp,
  Trophy,
  User,
  Utensils,
  X,
  Zap,
} from 'lucide-react'
import BrandMark, { BrandEmblem } from '@/components/brand/BrandMark'
import { secondsLeftFromInput } from '@/lib/exerciseTiming'

const CARD = 'rounded-2xl border border-border/50 bg-card/80'

// ── App chrome ────────────────────────────────────────────────────────────
// Every mock is wrapped in the same shell the real app uses: a status bar, the
// Uttar Fitness title bar, the scrollable screen, and the five-slot bottom nav
// (AI · Home · Insights · Workouts · Profile).

function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-4 pb-0.5 pt-2.5 text-[9px] font-semibold tracking-wide text-muted-foreground"
      aria-hidden="true"
    >
      <span>10:41</span>
      <span className="flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="ml-0.5 h-1.5 w-3.5 rounded-[3px] border border-current opacity-60" />
      </span>
    </div>
  )
}

function TopBar() {
  return (
    <div className="flex items-center justify-center gap-1.5 border-b border-border/40 px-4 py-2">
      <BrandMark className="h-5 w-5 rounded-md" emblemClassName="w-3.5" />
      <span className="text-[11px] font-black tracking-tight">Uttar Fitness</span>
    </div>
  )
}

const NAV_ITEMS = [
  { key: 'ai', label: 'AI' },
  { key: 'home', label: 'Home', icon: Home },
  { key: 'insights', label: 'Insights', icon: BarChart2 },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
  { key: 'profile', label: 'Profile', icon: User },
]

function BottomNav({ active = 'home', onNavigate }) {
  return (
    <div className="m-2 flex shrink-0 items-center gap-1 rounded-2xl border border-border/50 bg-card/70 px-1.5 py-1.5 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active
        const tone = isActive ? 'text-[hsl(var(--accent-text))]' : 'text-muted-foreground'
        const inner = (
          <>
            {key === 'ai' ? (
              <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(var(--brand-tile))] ring-1 ring-[hsl(var(--brand-mark)/0.22)]">
                <BrandEmblem className="w-4" />
                <Sparkles className="absolute -right-0.5 -top-0.5 h-2 w-2 text-primary" />
              </span>
            ) : (
              <Icon className={`h-[15px] w-[15px] ${tone}`} />
            )}
            <span className={`text-[8px] font-semibold leading-none ${tone}`}>{label}</span>
          </>
        )
        const cls = `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 py-1.5 transition-colors ${isActive ? 'border-primary/35 bg-primary/15' : 'border-border/50 bg-secondary/45'}`
        return onNavigate ? (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`${cls} hover:bg-secondary/60`}
          >
            {inner}
          </button>
        ) : (
          <span key={key} className={cls}>{inner}</span>
        )
      })}
    </div>
  )
}

function AppScreen({ children, active = 'home', onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <TopBar />
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <BottomNav active={active} onNavigate={onNavigate} />
    </div>
  )
}

/** Decorative phone shell used by the landing page previews. */
export function PhoneFrame({ children, className = '', label, active = 'home', onNavigate }) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[320px] ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-1.5 shadow-[0_35px_90px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="h-[500px] overflow-hidden rounded-[2rem] border border-border/50 bg-background/90">
          <AppScreen active={active} onNavigate={onNavigate}>{children}</AppScreen>
        </div>
      </div>
    </div>
  )
}

/** Wide browser-style frame for the interactive demo. */
export function DemoFrame({ children, className = '', active = 'home', onNavigate, theme = 'alabaster' }) {
  // The phone preview follows the public page's shared preview wallpaper.
  // Theme classes work on this inner element too, so all mock tokens (cards,
  // text, nav) follow the selected wallpaper without a reload.
  const screenTheme = ['cosmic', 'alabaster'].includes(theme) ? theme : 'alabaster'
  // `color` must be set here too: the public page's <html> owns the inherited
  // text color, so changing only the CSS variables on this nested element would
  // leave dark-preview text black-on-black.
  const screenStyle = screenTheme === 'cosmic'
    ? { background: '#000', color: 'hsl(var(--foreground))' }
    : { background: '#fff', color: 'hsl(var(--foreground))' }
  return (
    <div className={`mx-auto w-full max-w-2xl ${className}`}>
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/70 p-1.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div style={screenStyle} className={`overflow-hidden rounded-[1.35rem] border border-border/50 theme-${screenTheme}`}>
          <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            <span className="mx-auto rounded-md bg-secondary/70 px-3 py-0.5 text-[9px] text-muted-foreground">xfit-bpe.pages.dev</span>
          </div>
          <div className="mx-auto h-[560px] w-full max-w-[400px]">
            <AppScreen active={active} onNavigate={onNavigate}>{children}</AppScreen>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────
export function HomeMock({ done = false, onToggleDone, onNavigate }) {
  const interactive = typeof onToggleDone === 'function'
  const go = typeof onNavigate === 'function' ? onNavigate : null
  const weekWorkouts = done ? 5 : 4
  const weekMinutes = done ? 150 : 118
  const weekCalories = done ? 1000 : 820
  const stats = [
    { label: 'Workouts', value: weekWorkouts, goal: 7 },
    { label: 'Minutes', value: weekMinutes, goal: 150 },
    { label: 'Calories', value: weekCalories, goal: 2000 },
  ]
  const quick = [
    { key: 'plan', label: 'Plan', icon: CalendarDays },
    { key: 'ai', label: 'Ask AI', icon: Sparkles },
    { key: 'run', label: 'Run', icon: Zap },
  ]

  return (
    <div className="space-y-3 px-4 py-3.5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-[10px] text-muted-foreground">Good morning</p>
          <p className="text-lg font-extrabold leading-tight">Demo user</p>
        </div>
        <figure className="min-w-0 max-w-[54%] rounded-xl bg-card/50 px-2.5 py-1.5 text-right">
          <blockquote className="text-[8px] italic leading-snug text-muted-foreground">
            &ldquo;Direct Your Greatness, Live Uttar&rdquo;
          </blockquote>
        </figure>
      </div>

      <div className={`${CARD} flex items-center justify-between gap-2 p-3`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {done
            ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold leading-tight">Today</p>
            <p className="truncate text-[9px] leading-snug text-muted-foreground">
              {done ? 'Workout done. Rest up and recover.' : 'Core Focus · 39 min'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!done && (interactive ? (
            <button
              type="button"
              onClick={onToggleDone}
              aria-label="Complete the sample workout"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="h-3 w-3 fill-white text-white" />
            </button>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient" aria-hidden="true">
              <Play className="h-3 w-3 fill-white text-white" />
            </span>
          ))}
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[9px] leading-tight text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" /> Check-in
          </span>
        </div>
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold leading-tight">This week</p>
          <p className="whitespace-nowrap text-[9px] leading-tight text-muted-foreground">{done ? 5 : 4} day streak</p>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {stats.map(({ label, value, goal }) => (
            <div key={label} className="min-w-0 rounded-xl border border-border/40 bg-background/40 p-2 text-center">
              <p className="text-sm font-bold leading-none tabular-nums">{value.toLocaleString()}</p>
              <p className="mt-1 truncate text-[8px] font-medium leading-tight text-muted-foreground">{label}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (value / goal) * 100)}%` }}
                />
              </div>
              <p className="mt-1 truncate text-[7px] leading-none text-muted-foreground">of {goal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2.5">
          <p className="text-[11px] font-semibold leading-tight">Start a workout</p>
          {go ? (
            <button
              type="button"
              onClick={() => go('workouts')}
              className="flex items-center text-[9px] text-[hsl(var(--accent-text))]"
            >
              All <ChevronRight className="h-2.5 w-2.5" />
            </button>
          ) : (
            <span className="flex items-center text-[9px] text-[hsl(var(--accent-text))]">
              All <ChevronRight className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        {[
          ['Core Crusher', 'Mine · 12 min · 6 exercises', Dumbbell],
          ['Athletic HIIT Cardio', 'Suggested · hiit · 30 min', Flame],
        ].map(([title, meta, Icon]) => {
          const row = (
            <>
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium">{title}</p>
                <p className="truncate text-[8px] text-muted-foreground">{meta}</p>
              </div>
              <Play className="h-3 w-3 shrink-0 text-muted-foreground" />
            </>
          )
          const rowClass = 'flex w-full items-center gap-2.5 border-t border-border/40 px-3 py-2 text-left'
          return go ? (
            <button
              key={title}
              type="button"
              onClick={() => go(`workout:${title}`)}
              aria-label={`Open ${title} in the demo player`}
              className={`${rowClass} transition-colors hover:bg-secondary/50 active:bg-secondary/70`}
            >
              {row}
            </button>
          ) : (
            <div key={title} className={rowClass}>{row}</div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quick.map(({ key, label, icon: Icon }) => {
          const inner = (
            <>
              <Icon className="h-3 w-3 text-muted-foreground" /> {label}
            </>
          )
          const cls = `${CARD} flex items-center justify-center gap-1 py-2 text-[9px] font-medium`
          return go ? (
            <button key={key} type="button" onClick={() => go(key)} className={cls}>{inner}</button>
          ) : (
            <span key={key} className={cls}>{inner}</span>
          )
        })}
      </div>
    </div>
  )
}

// ── Guided player (interactive demo) ──────────────────────────────────────
const DEMO_EXERCISES = {
  'Core Crusher': ['Crunches', 'Plank', 'Russian Twist'],
  'Athletic HIIT Cardio': ['Jumping Jacks', 'High Knees', 'Mountain Climbers'],
}
const DEMO_SETS_PER_EXERCISE = 3
const DEMO_TARGET_REPS = 12
const DEMO_TARGET_SECONDS = 45
const DEMO_REST_SECONDS = 20

const demoClock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const clampDemoSeconds = (seconds) => Math.max(0, Math.min(DEMO_TARGET_SECONDS, Math.round(seconds)))

/** A small working player so the demo can show sets, reps and rest without an account. */
export function WorkoutPlayerMock({ title = 'Core Crusher', onExit }) {
  const exercises = DEMO_EXERCISES[title] || DEMO_EXERCISES['Core Crusher']
  const totalSets = exercises.length * DEMO_SETS_PER_EXERCISE
  const [setIndex, setSetIndex] = useState(0)
  const [mode, setMode] = useState('reps')
  const [reps, setReps] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DEMO_TARGET_SECONDS)
  const [timeDraft, setTimeDraft] = useState('')
  const [restTotal, setRestTotal] = useState(0)
  const [restLeft, setRestLeft] = useState(0)
  const [finished, setFinished] = useState(false)

  const resting = restTotal > 0
  const isTime = mode === 'time'

  const advance = () => {
    setRestTotal(0)
    setRestLeft(0)
    setReps(0)
    setSecondsLeft(DEMO_TARGET_SECONDS)
    setTimeDraft('')
    if (setIndex + 1 >= totalSets) setFinished(true)
    else setSetIndex((i) => i + 1)
  }

  const completeSet = () => {
    if (setIndex + 1 >= totalSets) {
      setFinished(true)
      return
    }
    setRestTotal(DEMO_REST_SECONDS)
    setRestLeft(DEMO_REST_SECONDS)
  }

  useEffect(() => {
    if (!resting) return undefined
    const id = window.setInterval(() => {
      setRestLeft((n) => {
        if (n <= 1) {
          window.clearInterval(id)
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [resting])

  useEffect(() => {
    if (!isTime || resting || finished) return undefined
    const id = window.setInterval(() => {
      setSecondsLeft((n) => {
        if (n <= 0) {
          window.clearInterval(id)
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [isTime, resting, finished])

  const applyTime = (event) => {
    event.preventDefault()
    setSecondsLeft(secondsLeftFromInput(timeDraft, DEMO_TARGET_SECONDS, secondsLeft))
    setTimeDraft('')
  }

  const selectMode = (next) => {
    setMode(next)
    setSecondsLeft(DEMO_TARGET_SECONDS)
    setTimeDraft('')
  }

  const exerciseIdx = Math.floor(setIndex / DEMO_SETS_PER_EXERCISE)
  const setNo = (setIndex % DEMO_SETS_PER_EXERCISE) + 1
  const progress = finished ? 100 : ((setIndex + 1) / totalSets) * 100
  const displayValue = resting ? restLeft : isTime ? secondsLeft : reps
  const displayLabel = resting
    ? 'seconds of rest'
    : isTime
      ? `seconds left · target ${demoClock(DEMO_TARGET_SECONDS)}`
      : `reps · target ${DEMO_TARGET_REPS}`

  return (
    <div className="space-y-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        {onExit ? (
          <button type="button" onClick={onExit}
            className="flex min-h-[32px] items-center gap-1 rounded-lg px-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        ) : <span />}
        <p className="min-w-0 truncate text-[10px] font-bold">{title}</p>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">DEMO</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {finished ? (
        <div className={`${CARD} flex flex-col items-center gap-2 p-5 text-center`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="text-base font-black">Workout complete</p>
          <p className="text-[9px] text-muted-foreground">{totalSets} sets logged in the demo. Nothing was saved.</p>
          {onExit && (
            <button type="button" onClick={onExit}
              className="mt-1 min-h-[36px] w-full rounded-xl primary-gradient px-3 text-[10px] font-bold text-white">
              Back to Home
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`${CARD} p-4 text-center`}>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Set {setNo} of {DEMO_SETS_PER_EXERCISE}
            </p>
            <p className="mt-1 text-lg font-black leading-tight">{exercises[exerciseIdx]}</p>
            <p className="mt-3 text-5xl font-black tabular-nums">
              {isTime && !resting ? demoClock(displayValue) : displayValue}
            </p>
            <p className="text-[9px] text-muted-foreground">{displayLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/50 p-1">
            <button type="button" aria-pressed={!isTime} onClick={() => selectMode('reps')}
              className={`flex min-h-[30px] items-center justify-center gap-1 rounded-lg text-[9px] font-bold transition-colors ${!isTime ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Dumbbell className="h-3 w-3" /> Reps
            </button>
            <button type="button" aria-pressed={isTime} onClick={() => selectMode('time')}
              className={`flex min-h-[30px] items-center justify-center gap-1 rounded-lg text-[9px] font-bold transition-colors ${isTime ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Timer className="h-3 w-3" /> Time
            </button>
          </div>

          {resting ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={advance}
                className="flex min-h-[40px] items-center justify-center gap-1 rounded-xl border border-border bg-secondary/60 px-2 text-[10px] font-bold">
                <SkipForward className="h-3 w-3" /> Skip Rest
              </button>
              <button type="button" onClick={advance} disabled={restLeft > 0}
                className="min-h-[40px] rounded-xl primary-gradient px-2 text-[10px] font-bold text-white disabled:opacity-40">
                {restLeft > 0 ? 'Resting…' : 'Next set'}
              </button>
            </div>
          ) : isTime ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] gap-2">
                <button type="button" aria-label="Subtract five seconds"
                  onClick={() => setSecondsLeft((n) => clampDemoSeconds(n - 5))}
                  className="flex min-h-[42px] items-center justify-center rounded-xl border border-border bg-secondary/60">
                  <Minus className="h-4 w-4" />
                </button>
                <form onSubmit={applyTime} className="flex min-w-0 items-center gap-1">
                  <input
                    value={timeDraft}
                    onChange={(event) => setTimeDraft(event.target.value)}
                    inputMode="numeric"
                    aria-label="Demo time left"
                    placeholder={demoClock(secondsLeft)}
                    className="h-[42px] w-full min-w-0 rounded-xl border border-border bg-background/70 px-2 text-center text-xs font-bold tabular-nums outline-none focus:border-primary"
                  />
                  <button type="submit" className="h-[42px] shrink-0 rounded-xl border border-border bg-secondary/60 px-2 text-[9px] font-bold">Apply</button>
                </form>
                <button type="button" aria-label="Add five seconds"
                  onClick={() => setSecondsLeft((n) => clampDemoSeconds(n + 5))}
                  className="flex min-h-[42px] items-center justify-center rounded-xl border border-primary/30 bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={completeSet}
                className="min-h-[42px] w-full rounded-xl primary-gradient px-2 text-[10px] font-bold text-white">
                {setIndex + 1 >= totalSets ? 'Finish set' : 'Complete set'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button type="button" aria-label="Decrease reps" onClick={() => setReps((n) => Math.max(0, n - 1))}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-secondary/60">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={completeSet}
                className="min-h-[44px] rounded-xl primary-gradient px-2 text-[10px] font-bold text-white">
                {setIndex + 1 >= totalSets ? 'Finish set' : 'Complete set'}
              </button>
              <button type="button" aria-label="Increase reps" onClick={() => setReps((n) => Math.min(DEMO_TARGET_REPS, n + 1))}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-secondary/60">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-center text-[8px] text-muted-foreground">
            Demo player · typing 0:45 shows 45 seconds left. Camera counting and voice cues live in the full app.
          </p>
        </>
      )}
    </div>
  )
}

// ── Insights (Health + Stats share one tab) ───────────────────────────────
const INSIGHTS_VIEWS = [
  { key: 'health', label: 'Health', icon: Heart },
  { key: 'stats', label: 'Stats', icon: BarChart2 },
]

function InsightsHeader({ view, onView }) {
  return (
    <div className="px-4 pt-3">
      <div className="text-lg font-bold leading-tight">Insights</div>
      <p className="text-[10px] leading-tight text-muted-foreground">Your health and training, in one place.</p>

      <div
        {...(onView ? { role: 'tablist', 'aria-label': 'Insights sections' } : {})}
        className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-2xl border border-border/60 bg-secondary/40 p-1"
      >
        {INSIGHTS_VIEWS.map(({ key, label, icon: Icon }) => {
          const active = view === key
          const inner = (
            <>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary/15 text-primary' : 'bg-secondary/70 text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={`min-w-0 truncate text-xs font-bold leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </>
          )
          const cls = `flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-colors ${active ? 'bg-card shadow-sm ring-1 ring-border/60' : ''}`
          return onView ? (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onView(key)}
              className={`${cls} ${active ? '' : 'hover:bg-secondary/60'}`}
            >
              {inner}
            </button>
          ) : (
            <span key={key} className={cls}>{inner}</span>
          )
        })}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, pct, tone = 'text-primary' }) {
  return (
    <div className={`${CARD} min-w-0 p-2.5`}>
      <div className="flex items-center gap-1.5 truncate text-[9px] leading-tight text-muted-foreground">
        <Icon className={`h-3 w-3 shrink-0 ${tone}`} /> <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-base font-bold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[8px] leading-tight text-muted-foreground">{sub}</p>}
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[8px] text-muted-foreground">{pct}%</p>
    </div>
  )
}

const HEALTH_SUB_TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'weight', label: 'Weight', icon: Scale },
  { key: 'nutrition', label: 'Nutrition', icon: Utensils },
]

export function InsightsHealthMock({
  view = 'health',
  onView,
  tab = 'overview',
  onTab,
  onLog,
}) {
  return (
    <>
      <InsightsHeader view={view} onView={onView} />

      <div className="space-y-3 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl bg-secondary/50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HEALTH_SUB_TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key
              const inner = (
                <>
                  <Icon className="h-3 w-3 shrink-0" /> {label}
                </>
              )
              const cls = `flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-[10px] font-semibold leading-tight transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`
              return onTab ? (
                <button key={key} type="button" aria-pressed={active} onClick={() => onTab(key)} className={cls}>{inner}</button>
              ) : (
                <span key={key} className={cls}>{inner}</span>
              )
            })}
          </div>
          {tab === 'overview' && (onLog ? (
            <button
              type="button"
              onClick={onLog}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-primary px-2 py-2 text-[10px] font-semibold text-primary-foreground"
            >
              <Plus className="h-3 w-3 shrink-0" /> Log
            </button>
          ) : (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-primary px-2 py-2 text-[10px] font-semibold text-primary-foreground">
              <Plus className="h-3 w-3 shrink-0" /> Log
            </span>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard icon={Footprints} label="Steps" value="2,638" sub="of 10,000 goal" pct={26} tone="text-blue-400" />
            <MetricCard icon={Moon} label="Sleep" value="9h" sub="of 8 goal" pct={100} tone="text-purple-400" />
            <MetricCard icon={Heart} label="Heart Rate" value="67 bpm" sub="Resting: 63 bpm" pct={67} tone="text-red-400" />
            <MetricCard icon={Flame} label="Cal Burned" value="0" sub="of 500 goal" pct={0} tone="text-orange-400" />
          </div>
        )}

        {tab === 'weight' && (
          <div className={`${CARD} p-3`}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[11px] font-semibold leading-tight">Weight trend</p>
              <p className="whitespace-nowrap text-[9px] leading-tight text-muted-foreground">Last 30 days</p>
            </div>
            <p className="mt-2 text-2xl font-black leading-none tabular-nums">
              78.4 <span className="text-[11px] font-semibold text-muted-foreground">kg</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-[9px] text-green-400">
              <TrendingUp className="h-3 w-3" /> 1.2 kg down this month
            </p>
            <Sparkline points={[80, 79.6, 79.8, 79.1, 78.9, 78.6, 78.4]} className="mt-2 h-16 w-full" />
          </div>
        )}

        {tab === 'nutrition' && (
          <div className={`${CARD} p-3`}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight">
                <Utensils className="h-3 w-3 shrink-0 text-[hsl(var(--accent-text))]" /> Nutrition
              </p>
              <p className="whitespace-nowrap text-[9px] leading-tight text-muted-foreground">
                <span className="font-semibold text-foreground">1,840</span> / 2,300 kcal
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[80%] rounded-full primary-gradient" />
            </div>
            <div className="mt-2.5 space-y-1.5">
              {[
                ['Protein', 128, 160],
                ['Carbs', 190, 240],
                ['Fat', 58, 70],
              ].map(([label, value, goal]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-9 text-[8px] text-muted-foreground">{label}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
                  </div>
                  <span className="w-12 text-right text-[8px] tabular-nums text-muted-foreground">{value}/{goal}g</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const STATS_RANGES = {
  '1W': [1, 0, 2, 1, 3, 0, 2],
  '1M': [2, 1, 0, 3, 2, 1, 4, 2, 1, 0, 3, 2, 1, 2],
  '3M': [3, 2, 1, 4, 2, 3, 1, 2, 4, 3, 2, 1, 3, 2, 4, 2],
  All: [1, 2, 1, 3, 2, 4, 3, 2, 5, 3, 4, 2, 3, 4, 2, 3, 5, 4, 3, 2],
}

export function InsightsStatsMock({ view = 'stats', onView, range = '1M', onRange }) {
  const points = STATS_RANGES[range] || STATS_RANGES['1M']
  return (
    <>
      <InsightsHeader view={view} onView={onView} />

      <div className="space-y-3 px-4 py-3.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Workouts', value: 48, tone: 'text-primary', icon: Calendar },
            { label: 'Streak', value: 7, tone: 'text-orange-400', icon: Flame },
            { label: 'Best Week', value: 28, tone: 'text-green-400', icon: Trophy },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={`${CARD} min-w-0 p-2.5`}>
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              <p className={`mt-1 text-xl font-black leading-none tabular-nums ${tone}`}>{value}</p>
              <p className="mt-1 truncate text-[8px] font-medium leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Minutes', value: 10, tone: 'text-blue-400', icon: Clock },
            { label: 'Total Calories', value: 93, tone: 'text-orange-400', icon: TrendingUp },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={`${CARD} min-w-0 p-2.5`}>
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              <p className={`mt-1 text-xl font-black leading-none tabular-nums ${tone}`}>{value}</p>
              <p className="mt-1 truncate text-[8px] font-medium leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className={`${CARD} p-3`}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight">Activity</p>
              <p className="truncate text-[9px] leading-tight text-muted-foreground">Workouts per day</p>
            </div>
            <div className="flex shrink-0 gap-0.5 rounded-xl bg-secondary/50 p-0.5">
              {Object.keys(STATS_RANGES).map((key) => {
                const active = range === key
                const cls = `whitespace-nowrap rounded-lg px-1.5 py-1 text-[9px] font-semibold leading-tight transition-all ${active ? 'bg-primary text-white' : 'text-muted-foreground'}`
                return onRange ? (
                  <button key={key} type="button" aria-pressed={active} onClick={() => onRange(key)} className={cls}>{key}</button>
                ) : (
                  <span key={key} className={cls}>{key}</span>
                )
              })}
            </div>
          </div>
          <Sparkline points={points} className="mt-3 h-24 w-full" />
          <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
            <span>Oct 14</span>
            <span>Nov 7</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Workouts ──────────────────────────────────────────────────────────────
const WORKOUT_LIBRARY = [
  { title: 'Core Crusher', type: 'strength', difficulty: 'intermediate', minutes: 12, calories: 220, muscle: 'Core' },
  { title: 'Athletic HIIT Cardio', type: 'hiit', difficulty: 'advanced', minutes: 30, calories: 420, muscle: 'Legs' },
  { title: 'Full Body Strength', type: 'strength', difficulty: 'intermediate', minutes: 45, calories: 380, muscle: 'Chest' },
  { title: 'Inferno HIIT Burn', type: 'hiit', difficulty: 'advanced', minutes: 25, calories: 360, muscle: 'Legs' },
  { title: 'Mobility Reset', type: 'mobility', difficulty: 'beginner', minutes: 20, calories: 120, muscle: 'Back' },
  { title: 'Power Strength', type: 'strength', difficulty: 'advanced', minutes: 40, calories: 400, muscle: 'Shoulders' },
  { title: 'Sunrise Yoga Flow', type: 'yoga', difficulty: 'beginner', minutes: 18, calories: 110, muscle: 'Core' },
  { title: 'Back & Biceps Builder', type: 'strength', difficulty: 'intermediate', minutes: 35, calories: 300, muscle: 'Back' },
  { title: 'Sprint Interval Cardio', type: 'cardio', difficulty: 'advanced', minutes: 22, calories: 330, muscle: 'Legs' },
  { title: 'Glute Activation', type: 'strength', difficulty: 'beginner', minutes: 15, calories: 140, muscle: 'Glutes' },
  { title: 'Shoulder & Arm Sculpt', type: 'strength', difficulty: 'intermediate', minutes: 28, calories: 250, muscle: 'Arms' },
  { title: 'Gentle Morning Stretch', type: 'mobility', difficulty: 'beginner', minutes: 12, calories: 70, muscle: 'Back' },
]

const WORKOUT_TYPES = ['All', 'hiit', 'strength', 'cardio', 'yoga', 'mobility']
const WORKOUT_DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced']
const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Glutes']

export function WorkoutsMock({
  search = '',
  onSearch,
  type = 'All',
  onType,
  difficulty = 'All',
  onDifficulty,
  muscle = 'All',
  onMuscle,
}) {
  const filtered = WORKOUT_LIBRARY.filter((w) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || w.title.toLowerCase().includes(q) || w.muscle.toLowerCase().includes(q)
    const matchType = type === 'All' || w.type === type
    const matchDiff = difficulty === 'All' || w.difficulty === difficulty
    const matchMuscle = muscle === 'All' || w.muscle === muscle
    return matchSearch && matchType && matchDiff && matchMuscle
  })

  const total = WORKOUT_LIBRARY.length
  // The header reports matches, not library size, so the number always agrees
  // with the grid. Active filters get their own chips and a one-tap reset.
  const activeFilters = []
  if (search.trim()) activeFilters.push({ key: 'search', label: `“${search.trim()}”`, clear: () => onSearch?.('') })
  if (type !== 'All') activeFilters.push({ key: 'type', label: type, clear: () => onType?.('All') })
  if (difficulty !== 'All') activeFilters.push({ key: 'difficulty', label: difficulty, clear: () => onDifficulty?.('All') })
  if (muscle !== 'All') activeFilters.push({ key: 'muscle', label: muscle, clear: () => onMuscle?.('All') })
  const isFiltered = activeFilters.length > 0
  const resetFilters = () => { onSearch?.(''); onType?.('All'); onDifficulty?.('All'); onMuscle?.('All') }

  const chip = (label, active, onClick, key) => {
    const cls = `shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-semibold capitalize leading-tight transition-all ${
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
    }`
    return onClick ? (
      <button key={key} type="button" aria-pressed={active} onClick={onClick} className={cls}>{label}</button>
    ) : (
      <span key={key} className={cls}>{label}</span>
    )
  }

  return (
    <div className="space-y-3 px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-lg font-black leading-tight">
            <Dumbbell className="h-4 w-4 text-primary" /> Workouts
          </div>
          <p className="text-[9px] text-muted-foreground">
            {isFiltered ? `${filtered.length} of ${total} workouts match` : `${total} workouts available`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="whitespace-nowrap rounded-lg bg-secondary/60 px-2 py-1 text-[9px] font-semibold leading-tight">Plan</span>
          <span className="whitespace-nowrap rounded-lg bg-primary/10 px-2 py-1 text-[9px] font-semibold leading-tight text-[hsl(var(--accent-text))]">+ Build</span>
        </div>
      </div>

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              aria-label={`Remove filter ${f.label}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold capitalize text-[hsl(var(--accent-text))] transition-colors hover:bg-primary/20"
            >
              {f.label}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Reset
          </button>
        </div>
      )}

      {onSearch ? (
        <label className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search workouts..."
            aria-label="Search workouts"
            className="h-9 w-full rounded-xl border border-border/60 bg-card pl-8 pr-3 text-[10px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        </label>
      ) : (
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex h-9 w-full items-center rounded-xl border border-border/60 bg-card pl-8 pr-3 text-[10px] text-muted-foreground">
            Search workouts...
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {WORKOUT_TYPES.map((t) => chip(t, type === t, onType ? () => onType(t) : null, t))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WORKOUT_DIFFICULTIES.map((d) => chip(d, difficulty === d, onDifficulty ? () => onDifficulty(d) : null, d))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.map((m) => chip(m, muscle === m, onMuscle ? () => onMuscle(m) : null, m))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-[10px] text-muted-foreground">
          <Dumbbell className="mx-auto mb-2 h-7 w-7 opacity-30" />
          No workouts found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((w) => (
            <div key={w.title} className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card/75 p-2.5">
              <p className="truncate text-[8px] uppercase tracking-wider leading-tight text-muted-foreground">{w.type}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-tight">{w.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap text-[8px] leading-tight text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5 shrink-0" />{w.minutes}m</span>
                <span className="flex items-center gap-1"><Flame className="h-2.5 w-2.5 shrink-0" />{w.calories}</span>
              </div>
              <p className="mt-1 truncate text-[9px] capitalize leading-tight text-muted-foreground">{w.difficulty}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────
const THEME_OPTIONS = [
  { key: 'cosmic', label: 'Dark mode', desc: 'Pure black', icon: Moon },
  { key: 'alabaster', label: 'Light mode', desc: 'Pure white', icon: Sun },
  { key: 'auto', label: 'Auto mode', desc: 'Dark at night', icon: Clock },
]

function ThemeSwatch({ mode }) {
  if (mode === 'auto') {
    return (
      <div className="relative h-8 w-full overflow-hidden rounded-lg border border-border/40 bg-white">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-black" />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-1.5 py-px text-[7px] font-bold tracking-wide text-foreground">AUTO</span>
      </div>
    )
  }
  const dark = mode === 'cosmic'
  return (
    <div className={`relative h-8 w-full overflow-hidden rounded-lg border ${dark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      <span className={`absolute left-1.5 top-1.5 h-0.5 w-6 rounded-full ${dark ? 'bg-white/30' : 'bg-black/15'}`} />
      <span className={`absolute left-1.5 top-3 h-0.5 w-4 rounded-full ${dark ? 'bg-white/15' : 'bg-black/10'}`} />
    </div>
  )
}

export function ProfileMock({ theme = 'cosmic', onTheme }) {
  return (
    <div className="space-y-3 px-4 py-3.5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <User className="h-6 w-6 text-primary" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Demo user</p>
          <p className="text-[9px] text-muted-foreground">demo@example.com</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-[hsl(var(--accent-text))]">Build Muscle</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-secondary-foreground">Advanced</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Workouts', value: 48, icon: Dumbbell, tone: 'text-primary' },
          { label: 'Minutes', value: 10, icon: Clock, tone: 'text-muted-foreground' },
          { label: 'Calories', value: 93, icon: Flame, tone: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`${CARD} p-2 text-center`}>
            <Icon className={`mx-auto h-3.5 w-3.5 ${tone}`} />
            <p className="mt-0.5 text-lg font-bold leading-none tabular-nums">{value}</p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-tight">
            <Settings className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Profile Settings</span>
          </p>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-secondary-foreground">Edit</span>
        </div>
        <div className="mt-2.5 space-y-1.5 text-[10px] leading-tight">
          {[
            ['Goal', 'Build Muscle'],
            ['Level', 'Advanced'],
            ['Preferred', 'Strength'],
            ['Distance Unit', 'Miles'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="truncate text-muted-foreground">{label}</span>
              <span className="truncate font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${CARD} space-y-2 p-3`}>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Palette className="h-3.5 w-3.5 text-primary" /> Wallpaper
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {THEME_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const selected = theme === key
            const inner = (
              <>
                {selected && (
                  <span className="absolute right-1 top-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2 w-2" strokeWidth={3} />
                  </span>
                )}
                <ThemeSwatch mode={key} />
                <span className={`mt-1.5 flex items-center gap-1 truncate text-[9px] font-semibold leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
                  <Icon className="h-2.5 w-2.5 shrink-0" /> {label}
                </span>
                <span className="block truncate text-[8px] leading-tight text-muted-foreground">{desc}</span>
              </>
            )
            const cls = `relative rounded-xl border p-1.5 text-left transition-all ${
              selected ? 'border-primary/70 bg-primary/10 ring-1 ring-primary/25' : 'border-border/40 bg-secondary/40'
            }`
            return onTheme ? (
              <button key={key} type="button" aria-pressed={selected} onClick={() => onTheme(key)} className={`${cls} hover:bg-secondary/70`}>
                {inner}
              </button>
            ) : (
              <span key={key} className={cls}>{inner}</span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Small inline area chart used by the Weight and Activity cards. */
function Sparkline({ points, className = '' }) {
  const w = 100
  const h = 40
  const max = Math.max(...points, 1)
  const step = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((p, i) => [i * step, h - (p / max) * (h - 6) - 3])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={area} fill="hsl(var(--primary))" fillOpacity="0.16" />
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  )
}

export const PREVIEW_SCREENS = [
  { key: 'home', label: 'Home', caption: 'Your day, decided', Component: HomeMock, active: 'home' },
  { key: 'health', label: 'Health', caption: 'Metrics & food log', Component: InsightsHealthMock, active: 'insights' },
  { key: 'stats', label: 'Stats', caption: 'Totals & trends', Component: InsightsStatsMock, active: 'insights' },
  { key: 'workouts', label: 'Workouts', caption: 'Find your next session', Component: WorkoutsMock, active: 'workouts' },
  { key: 'profile', label: 'Profile', caption: 'Goals, themes & data', Component: ProfileMock, active: 'profile' },
]
