import React from 'react'
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  SkipForward,
  Sparkles,
  Utensils,
  Wind,
} from 'lucide-react'

const DAYS = [
  { key: 'Mon', short: 'M', title: 'Push', focus: 'Upper body strength', duration: 45, exercises: ['Bench press', 'Incline DB press', 'Triceps pushdown'] },
  { key: 'Tue', short: 'T', title: 'Pull', focus: 'Back & biceps', duration: 50, exercises: ['Barbell row', 'Lat pulldown', 'Hammer curl'] },
  { key: 'Wed', short: 'W', title: 'Rest', focus: 'Rest & recover', rest: true },
  { key: 'Thu', short: 'T', title: 'Legs', focus: 'Lower body strength', duration: 55, exercises: ['Back squat', 'Romanian deadlift', 'Split squat'] },
  { key: 'Fri', short: 'F', title: 'HIIT', focus: 'Conditioning', duration: 30, exercises: ['Intervals', 'Burpees', 'Row sprints'] },
  { key: 'Sat', short: 'S', title: 'Mobility', focus: 'Recovery flow', duration: 20, exercises: ['Hip flow', 'Thoracic opener', 'Full-body stretch'] },
  { key: 'Sun', short: 'S', title: 'Rest', focus: 'Rest & recover', rest: true },
]

const CARD = 'rounded-2xl border border-border/50 bg-card/80'

/** A decorative phone shell used by the landing page previews. */
export function PhoneFrame({ children, className = '', label }) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[300px] ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-1.5 shadow-[0_35px_90px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-background/90">
          <div className="flex items-center justify-between px-4 pb-0.5 pt-2.5 text-[9px] font-semibold tracking-wide text-muted-foreground/80" aria-hidden="true">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="ml-0.5 h-1.5 w-3.5 rounded-[3px] border border-current opacity-60" />
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Wide browser-style frame for the interactive demo. */
export function DemoFrame({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-2xl ${className}`}>
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/70 p-1.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-background/90">
          <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            <span className="mx-auto rounded-md bg-secondary/70 px-3 py-0.5 text-[9px] text-muted-foreground">xfit-bpe.pages.dev</span>
          </div>
          <div className="p-3 sm:p-5">
            <div className="mx-auto w-full max-w-[340px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardMock({ done = false, onToggleDone }) {
  const interactive = typeof onToggleDone === 'function'
  const workouts = done ? 5 : 4
  const minutes = done ? 158 : 128
  const calories = done ? 1660 : 1240
  const stats = [
    { label: 'Workouts', value: workouts, goal: 5 },
    { label: 'Minutes', value: minutes, goal: 150 },
    { label: 'Calories', value: calories, goal: 2000 },
  ]

  return (
    <div className="space-y-2.5 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground">Good morning, Bhanu</p>
          <p className="truncate text-lg font-extrabold leading-tight">Let&rsquo;s move.</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-[hsl(var(--accent-text))]">
          <Flame className="h-3 w-3" /> 7
        </span>
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[hsl(var(--accent-text))]">
            {done ? <Check className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {done ? 'Complete' : 'Today'}
            </p>
            <p className="truncate text-xs font-semibold">{done ? 'Workout complete' : 'Athletic HIIT Cardio'}</p>
            <p className="truncate text-[9px] text-muted-foreground">
              {done ? 'Nice work. Recover well.' : '30 min · full body · 420 kcal'}
            </p>
          </div>
          {interactive ? (
            <button
              type="button"
              onClick={onToggleDone}
              aria-label={done ? 'Mark workout as not done' : 'Complete the workout'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
              <Play className="h-3 w-3 fill-current" />
            </span>
          )}
        </div>
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-semibold">This week</p>
          <p className="text-[9px] text-muted-foreground">7 day streak</p>
        </div>
        <div className="mt-2.5 grid grid-cols-3 divide-x divide-border/40">
          {stats.map(({ label, value, goal }, i) => (
            <div key={label} className={i === 0 ? 'pr-2.5' : 'px-2.5'}>
              <p className="text-base font-bold leading-none tabular-nums">{value.toLocaleString()}</p>
              <p className="mt-1 text-[8px] text-muted-foreground">{label}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between px-3 pb-1 pt-2.5">
          <p className="text-[10px] font-semibold">Start a workout</p>
          <span className="flex items-center text-[9px] text-[hsl(var(--accent-text))]">All <ChevronRight className="h-2.5 w-2.5" /></span>
        </div>
        {[
          ['Lower Body Strength', 'Mine · 40 min · 6 exercises', Dumbbell],
          ['Sunrise Mobility', 'Suggested · mobility · 20 min', Wind],
        ].map(([title, meta, Icon]) => (
          <div key={title} className="flex items-center gap-2.5 border-t border-border/40 px-3 py-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">{title}</p>
              <p className="truncate text-[8px] text-muted-foreground">{meta}</p>
            </div>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ['Plan', CalendarDays],
          ['Ask AI', Sparkles],
          ['Run', Footprints],
        ].map(([label, Icon]) => (
          <span key={label} className={`${CARD} flex items-center justify-center gap-1 py-2 text-[9px] font-medium`}>
            <Icon className="h-3 w-3 text-muted-foreground" /> {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PlanMock({ selected = 'Mon', onSelect }) {
  const interactive = typeof onSelect === 'function'
  const day = DAYS.find((d) => d.key === selected) ?? DAYS[0]

  return (
    <div className="space-y-2.5 p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-muted-foreground">Your training week</p>
          <p className="text-lg font-extrabold leading-tight">Weekly plan</p>
        </div>
        <span className="rounded-full bg-secondary/70 px-2 py-1 text-[9px] font-semibold text-muted-foreground">5 days on</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => {
          const active = d.key === selected
          const inner = (
            <>
              <span className={`text-[8px] font-semibold ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{d.short}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${d.rest ? 'bg-border' : active ? 'bg-primary-foreground' : 'bg-primary/70'}`} />
            </>
          )
          const cls = `flex flex-col items-center rounded-xl py-1.5 transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/60 hover:bg-secondary'}`
          return interactive ? (
            <button key={d.key} type="button" onClick={() => onSelect(d.key)} aria-pressed={active} className={cls}>
              {inner}
            </button>
          ) : (
            <span key={d.key} className={cls}>{inner}</span>
          )
        })}
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{day.key}</p>
            <p className="text-sm font-bold">{day.title}</p>
            <p className="text-[9px] text-muted-foreground">{day.focus}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-[hsl(var(--accent-text))]">
            {day.rest ? <Moon className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {day.rest ? 'Rest' : `${day.duration} min`}
          </span>
        </div>

        {day.rest ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary/60 p-2.5">
            <Moon className="h-4 w-4 shrink-0 text-[hsl(var(--accent-text))]" />
            <p className="text-[9px] leading-snug text-muted-foreground">Recovery is part of the plan. A short walk or mobility flow is plenty.</p>
          </div>
        ) : (
          <>
            <ul className="mt-2.5 space-y-1.5">
              {day.exercises.map((exercise) => (
                <li key={exercise} className="flex items-center gap-2 text-[9px]">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/10 text-[hsl(var(--accent-text))]">
                    <Check className="h-2 w-2" />
                  </span>
                  <span className="text-muted-foreground">{exercise}</span>
                </li>
              ))}
            </ul>
            <span className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary text-[10px] font-semibold text-primary-foreground">
              <Play className="h-2.5 w-2.5 fill-current" /> Start session
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[hsl(var(--accent-text))]" /> Adapt the week with AI</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  )
}

export function HealthMock({ water = 5, onWater }) {
  const interactive = typeof onWater === 'function'
  const glasses = Array.from({ length: 8 }, (_, i) => i < water)
  const macros = [
    { label: 'Protein', value: 128, goal: 160 },
    { label: 'Carbs', value: 190, goal: 240 },
    { label: 'Fat', value: 58, goal: 70 },
  ]

  return (
    <div className="space-y-2.5 p-3.5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] text-muted-foreground">Today, Nov 10</p>
          <p className="text-lg font-extrabold leading-tight">Health Hub</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-500">
          <Activity className="h-3 w-3" /> On track
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`${CARD} p-2.5`}>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><Footprints className="h-3 w-3" /> Steps</div>
          <p className="mt-1 text-base font-bold tabular-nums">6,842</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[68%] rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-[8px] text-muted-foreground">68% of 10,000</p>
        </div>
        <div className={`${CARD} p-2.5`}>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><Moon className="h-3 w-3" /> Sleep</div>
          <p className="mt-1 text-base font-bold tabular-nums">7h 24m</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[82%] rounded-full bg-indigo-400" />
          </div>
          <p className="mt-1 text-[8px] text-muted-foreground">82% of 9h goal</p>
        </div>
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-baseline justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold"><Utensils className="h-3 w-3 text-[hsl(var(--accent-text))]" /> Nutrition</p>
          <p className="text-[9px] text-muted-foreground"><span className="font-semibold text-foreground">1,840</span> / 2,300 kcal</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[80%] rounded-full primary-gradient" />
        </div>
        <div className="mt-2.5 space-y-1.5">
          {macros.map(({ label, value, goal }) => (
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

      <div className={`${CARD} flex items-center gap-2 p-3`}>
        <Droplets className="h-4 w-4 shrink-0 text-sky-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold">Water</p>
          <div className="mt-1 flex gap-1">
            {glasses.map((filled, i) => (
              <span key={i} className={`h-3.5 w-1.5 rounded-full ${filled ? 'bg-sky-400' : 'bg-secondary'}`} />
            ))}
          </div>
        </div>
        {interactive ? (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => onWater(-1)} aria-label="Remove a glass of water" className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
              <Minus className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => onWater(1)} aria-label="Add a glass of water" className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[hsl(var(--accent-text))] hover:bg-primary/25">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="text-[9px] font-semibold text-muted-foreground">{water} / 8</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`${CARD} p-2.5`}>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><HeartPulse className="h-3 w-3" /> Resting HR</div>
          <p className="mt-1 text-sm font-bold tabular-nums">58 <span className="text-[8px] font-normal text-muted-foreground">bpm</span></p>
        </div>
        <div className={`${CARD} p-2.5`}>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><Activity className="h-3 w-3" /> Weight</div>
          <p className="mt-1 text-sm font-bold tabular-nums">78.4 <span className="text-[8px] font-normal text-muted-foreground">kg</span></p>
        </div>
      </div>
    </div>
  )
}

export function WorkoutMock() {
  const circumference = 2 * Math.PI * 52
  const progress = 0.42

  return (
    <div className="space-y-3 p-3.5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-text))]">Full body · HIIT</span>
        <span className="text-[9px] text-muted-foreground">3 of 6</span>
      </div>

      <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="7" className="stroke-secondary" />
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="stroke-primary"
          />
        </svg>
        <div className="text-center">
          <p className="text-3xl font-black tabular-nums tracking-tight">12:34</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Work</p>
        </div>
      </div>

      <div className={`${CARD} p-3 text-center`}>
        <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Current exercise</p>
        <p className="mt-0.5 text-sm font-bold">Goblet squat</p>
        <p className="text-[9px] text-muted-foreground">3 sets × 12 reps · 16 kg</p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < 3 ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-secondary text-[10px] font-semibold text-secondary-foreground">
          <Pause className="h-3 w-3" /> Pause
        </span>
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-[10px] font-semibold text-primary-foreground">
          <SkipForward className="h-3 w-3" /> Next
        </span>
      </div>

      <p className="text-center text-[8px] text-muted-foreground">Form cue: brace your core, knees track over toes.</p>
    </div>
  )
}

export const PREVIEW_SCREENS = [
  { key: 'today', label: 'Today', caption: 'Your day, decided', Component: DashboardMock },
  { key: 'plan', label: 'Plan', caption: 'A week that adapts', Component: PlanMock },
  { key: 'health', label: 'Health', caption: 'Food, sleep & recovery', Component: HealthMock },
  { key: 'workout', label: 'Train', caption: 'Guided sessions', Component: WorkoutMock },
]

export { DAYS as PLAN_DAYS }
