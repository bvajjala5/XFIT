import React from 'react'
import {
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
  Moon,
  Palette,
  Play,
  Plus,
  Scale,
  Search,
  Settings,
  Sparkles,
  Sun,
  TrendingUp,
  Trophy,
  User,
  Utensils,
  Zap,
} from 'lucide-react'
import BrandMark, { BrandEmblem } from '@/components/brand/BrandMark'

const CARD = 'rounded-2xl border border-border/50 bg-card/80'

// ── App chrome ────────────────────────────────────────────────────────────
// Every mock is wrapped in the same shell the real app uses: a status bar, the
// Uttar Fitness title bar, the scrollable screen, and the five-slot bottom nav
// (AI · Home · Insights · Workouts · Profile).

function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-4 pb-0.5 pt-2.5 text-[9px] font-semibold tracking-wide text-muted-foreground/80"
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
    <div className="flex items-end gap-0.5 border-t border-border/40 bg-card/60 px-1 py-1.5">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active
        const tone = isActive ? 'text-primary' : 'text-muted-foreground'
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
        const cls = `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors ${isActive ? 'bg-primary/10' : ''}`
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
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      className={`relative mx-auto w-full max-w-[300px] ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-1.5 shadow-[0_35px_90px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="h-[470px] overflow-hidden rounded-[2rem] border border-border/50 bg-background/90">
          <AppScreen active={active} onNavigate={onNavigate}>{children}</AppScreen>
        </div>
      </div>
    </div>
  )
}

/** Wide browser-style frame for the interactive demo. */
export function DemoFrame({ children, className = '', active = 'home', onNavigate }) {
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
    <div className="space-y-3 p-3.5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-[10px] text-muted-foreground">Good morning</p>
          <p className="text-lg font-extrabold leading-tight">Alex</p>
        </div>
        <figure className="min-w-0 max-w-[54%] rounded-xl bg-card/50 px-2.5 py-1.5 text-right">
          <blockquote className="text-[8px] italic leading-snug text-muted-foreground">
            &ldquo;Take care of your body. It&rsquo;s the only place you have to live.&rdquo;
          </blockquote>
          <figcaption className="mt-0.5 text-[8px] text-muted-foreground/70">Jim Rohn</figcaption>
        </figure>
      </div>

      <div className={`${CARD} flex items-center gap-2 p-3`}>
        {done
          ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
          : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold">Today</p>
          <p className="truncate text-[9px] leading-snug text-muted-foreground">
            {done ? 'Workout done. Rest up and recover.' : 'Core Focus · 39 min'}
          </p>
        </div>
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
        <span className="flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" /> Check-in
        </span>
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold">This week</p>
          <p className="text-[9px] text-muted-foreground">{done ? 5 : 4} day streak</p>
        </div>
        <div className="mt-2.5 grid grid-cols-3 divide-x divide-border/40">
          {stats.map(({ label, value, goal }, i) => (
            <div key={label} className={i === 0 ? 'pr-2.5' : 'px-2.5'}>
              <p className="text-base font-bold leading-none tabular-nums">{value.toLocaleString()}</p>
              <p className="mt-1 text-[8px] text-muted-foreground">{label}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (value / goal) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[7px] text-muted-foreground">of {goal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between px-3 pb-1 pt-2.5">
          <p className="text-[11px] font-semibold">Start a workout</p>
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
        ].map(([title, meta, Icon]) => (
          <div key={title} className="flex items-center gap-2.5 border-t border-border/40 px-3 py-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">{title}</p>
              <p className="truncate text-[8px] text-muted-foreground">{meta}</p>
            </div>
            <Play className="h-3 w-3 shrink-0 text-muted-foreground" />
          </div>
        ))}
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

// ── Insights (Health + Stats share one tab) ───────────────────────────────
const INSIGHTS_VIEWS = [
  { key: 'health', label: 'Health', blurb: 'Metrics & food log', icon: Heart },
  { key: 'stats', label: 'Stats', blurb: 'Totals & trends', icon: BarChart2 },
]

function InsightsHeader({ view, onView }) {
  return (
    <div className="px-3.5 pt-3">
      <h1 className="text-lg font-bold leading-tight">Insights</h1>
      <p className="text-[10px] text-muted-foreground">Your health and training, in one place.</p>

      <div
        role="tablist"
        aria-label="Insights sections"
        className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-2xl border border-border/60 bg-secondary/40 p-1.5"
      >
        {INSIGHTS_VIEWS.map(({ key, label, blurb, icon: Icon }) => {
          const active = view === key
          const inner = (
            <>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary/15 text-primary' : 'bg-secondary/70 text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 text-left">
                <span className={`block text-[11px] font-bold leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                <span className="block truncate text-[9px] leading-tight text-muted-foreground">{blurb}</span>
              </span>
            </>
          )
          const cls = `flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${active ? 'bg-card shadow-sm ring-1 ring-border/60' : ''}`
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
    <div className={`${CARD} p-2.5`}>
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <Icon className={`h-3 w-3 ${tone}`} /> {label}
      </div>
      <p className="mt-1 text-base font-bold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[8px] text-muted-foreground">{sub}</p>}
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
  onNavigate,
}) {
  return (
    <>
      <InsightsHeader view={view} onView={onView} />

      <div className="space-y-3 p-3.5">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 rounded-2xl bg-secondary/50 p-1">
            {HEALTH_SUB_TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key
              const inner = (
                <>
                  <Icon className="h-3 w-3" /> {label}
                </>
              )
              const cls = `flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-[9px] font-semibold transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`
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
              className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-2.5 py-2 text-[10px] font-semibold text-primary-foreground"
            >
              <Plus className="h-3 w-3" /> Log
            </button>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-2.5 py-2 text-[10px] font-semibold text-primary-foreground">
              <Plus className="h-3 w-3" /> Log
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
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold">Weight trend</p>
              <p className="text-[9px] text-muted-foreground">Last 30 days</p>
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
            <div className="flex items-baseline justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Utensils className="h-3 w-3 text-[hsl(var(--accent-text))]" /> Nutrition
              </p>
              <p className="text-[9px] text-muted-foreground">
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

export function InsightsStatsMock({ view = 'stats', onView, range = '1M', onRange, onNavigate }) {
  const points = STATS_RANGES[range] || STATS_RANGES['1M']
  return (
    <>
      <InsightsHeader view={view} onView={onView} />

      <div className="space-y-3 p-3.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Workouts', value: 48, tone: 'text-primary', icon: Calendar },
            { label: 'Streak', value: 7, tone: 'text-orange-400', icon: Flame },
            { label: 'Best Week', value: 28, tone: 'text-green-400', icon: Trophy },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={`${CARD} p-2.5`}>
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              <p className={`mt-1 text-xl font-black leading-none tabular-nums ${tone}`}>{value}</p>
              <p className="mt-1 text-[8px] font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Minutes', value: 10, tone: 'text-blue-400', icon: Clock },
            { label: 'Total Calories', value: 93, tone: 'text-orange-400', icon: TrendingUp },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={`${CARD} p-2.5`}>
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              <p className={`mt-1 text-xl font-black leading-none tabular-nums ${tone}`}>{value}</p>
              <p className="mt-1 text-[8px] font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className={`${CARD} p-3`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold">Activity</p>
              <p className="text-[9px] text-muted-foreground">Workouts per day</p>
            </div>
            <div className="flex gap-0.5 rounded-xl bg-secondary/50 p-0.5">
              {Object.keys(STATS_RANGES).map((key) => {
                const active = range === key
                const cls = `rounded-lg px-1.5 py-1 text-[9px] font-semibold transition-all ${active ? 'bg-primary text-white' : 'text-muted-foreground'}`
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
  { title: 'Core Crusher', type: 'strength', difficulty: 'intermediate', minutes: 12, calories: 220 },
  { title: 'Athletic HIIT Cardio', type: 'hiit', difficulty: 'advanced', minutes: 30, calories: 420 },
  { title: 'Full Body Strength', type: 'strength', difficulty: 'intermediate', minutes: 45, calories: 380 },
  { title: 'Inferno HIIT Burn', type: 'hiit', difficulty: 'advanced', minutes: 25, calories: 360 },
  { title: 'Mobility Reset', type: 'mobility', difficulty: 'beginner', minutes: 20, calories: 120 },
  { title: 'Power Strength', type: 'strength', difficulty: 'advanced', minutes: 40, calories: 400 },
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
    const matchSearch = !search || w.title.toLowerCase().includes(search.toLowerCase())
    const matchType = type === 'All' || w.type === type
    const matchDiff = difficulty === 'All' || w.difficulty === difficulty
    return matchSearch && matchType && matchDiff
  })

  const chip = (label, active, onClick, key) => {
    const cls = `flex-shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize transition-all ${
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
    }`
    return onClick ? (
      <button key={key} type="button" aria-pressed={active} onClick={onClick} className={cls}>{label}</button>
    ) : (
      <span key={key} className={cls}>{label}</span>
    )
  }

  return (
    <div className="space-y-3 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-1.5 text-lg font-black leading-tight">
            <Dumbbell className="h-4 w-4 text-primary" /> Workouts
          </h1>
          <p className="text-[9px] text-muted-foreground">12 workouts available</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-lg bg-secondary/60 px-2 py-1 text-[9px] font-semibold">Plan</span>
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-[9px] font-semibold text-[hsl(var(--accent-text))]">+ Build</span>
        </div>
      </div>

      {onSearch ? (
        <label className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search workouts or trainers..."
            aria-label="Search workouts"
            className="h-9 w-full rounded-xl border border-border/60 bg-card pl-8 pr-3 text-[10px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        </label>
      ) : (
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex h-9 w-full items-center rounded-xl border border-border/60 bg-card pl-8 pr-3 text-[10px] text-muted-foreground">
            Search workouts or trainers...
          </span>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {WORKOUT_TYPES.map((t) => chip(t, type === t, onType ? () => onType(t) : null, t))}
      </div>

      <div className="flex gap-1.5">
        {WORKOUT_DIFFICULTIES.map((d) => chip(d, difficulty === d, onDifficulty ? () => onDifficulty(d) : null, d))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MUSCLE_GROUPS.map((m) => chip(m, muscle === m, onMuscle ? () => onMuscle(m) : null, m))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-[10px] text-muted-foreground">
          <Dumbbell className="mx-auto mb-2 h-7 w-7 opacity-30" />
          No workouts found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border/50 bg-card/75 p-3">
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{w.type}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug">{w.title}</p>
              <div className="mt-2 flex items-center gap-2.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{w.minutes}m</span>
                <span className="flex items-center gap-1"><Flame className="h-2.5 w-2.5" />{w.calories}</span>
              </div>
              <p className="mt-1 text-[9px] capitalize text-muted-foreground">{w.difficulty}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────
const THEME_OPTIONS = [
  { key: 'midnight', label: 'Midnight', desc: 'Always dark', icon: Moon },
  { key: 'sunrise', label: 'Sunrise', desc: 'Always light', icon: Sun },
  { key: 'auto', label: 'Auto', desc: 'By time', icon: Clock },
]

function ThemeSwatch({ mode }) {
  if (mode === 'auto') {
    return (
      <div
        className="relative h-8 w-full overflow-hidden rounded-lg border border-black/10"
        style={{ background: 'linear-gradient(135deg, #0b1020 0%, #111a33 49.5%, #fff1de 50.5%, #fff7ed 100%)' }}
      >
        <Moon className="absolute left-1.5 top-1 h-2.5 w-2.5 text-slate-200" />
        <Sun className="absolute bottom-1 right-1.5 h-3 w-3 text-orange-500" />
      </div>
    )
  }
  const dark = mode === 'midnight'
  return (
    <div className={`relative h-8 w-full overflow-hidden rounded-lg border ${dark ? 'border-white/10 bg-[#0b1020]' : 'border-black/5 bg-[#fff7ed]'}`}>
      <span className={`absolute left-1.5 top-1.5 h-0.5 w-6 rounded-full ${dark ? 'bg-white/30' : 'bg-black/15'}`} />
      <span className={`absolute left-1.5 top-3 h-0.5 w-4 rounded-full ${dark ? 'bg-white/15' : 'bg-black/10'}`} />
      <span
        className={`absolute bottom-1 right-1.5 h-2.5 w-2.5 rounded-full ${dark
          ? 'bg-blue-500 shadow-[0_0_8px_1px_rgba(59,130,246,0.55)]'
          : 'bg-orange-500 shadow-[0_0_8px_1px_rgba(249,115,22,0.45)]'}`}
      />
    </div>
  )
}

export function ProfileMock({ theme = 'midnight', onTheme }) {
  return (
    <div className="space-y-3 p-3.5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <User className="h-6 w-6 text-primary" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Alex Rivera</p>
          <p className="text-[9px] text-muted-foreground">alex.rivera@example.com</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-[hsl(var(--accent-text))]">Build Muscle</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-secondary-foreground">Advanced</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Workouts', value: 48, icon: Dumbbell, tone: 'text-primary' },
          { label: 'Minutes', value: 10, icon: Clock, tone: 'text-green-400' },
          { label: 'Calories', value: 93, icon: Flame, tone: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`${CARD} p-2 text-center`}>
            <Icon className={`mx-auto h-3.5 w-3.5 ${tone}`} />
            <p className="mt-0.5 text-lg font-bold leading-none tabular-nums">{value}</p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className={`${CARD} p-3`}>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold">
            <Settings className="h-3.5 w-3.5" /> Profile Settings
          </p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-secondary-foreground">Edit</span>
        </div>
        <div className="mt-2.5 space-y-1.5 text-[10px]">
          {[
            ['Goal', 'Build Muscle'],
            ['Level', 'Advanced'],
            ['Preferred', 'Strength'],
            ['Distance Unit', 'Miles'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${CARD} space-y-2 p-3`}>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Palette className="h-3.5 w-3.5 text-primary" /> App Theme
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
                <span className={`mt-1.5 flex items-center gap-1 text-[9px] font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                  <Icon className="h-2.5 w-2.5" /> {label}
                </span>
                <span className="block text-[8px] text-muted-foreground">{desc}</span>
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
