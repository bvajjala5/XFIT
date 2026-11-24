import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart2, Check, ChevronRight, Dumbbell, Home, Link2, Lock, RotateCcw, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import Wallpaper from '@/components/layout/Wallpaper'
import BrandMark from '@/components/brand/BrandMark'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import usePublicWallpaper from '@/hooks/usePublicWallpaper'
import usePageMeta from '@/hooks/usePageMeta'
import { useAuth } from '@/lib/AuthContext'
import {
  DemoFrame,
  HomeMock,
  InsightsHealthMock,
  InsightsStatsMock,
  ProfileMock,
  WorkoutPlayerMock,
  WorkoutsMock,
} from '@/components/landing/AppMocks'
import { AIPreview, BarcodePreview, FormCheckPreview } from '@/components/landing/DemoPreviews'

const TABS = [
  {
    key: 'home',
    label: 'Home',
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
    key: 'insights',
    label: 'Insights',
    icon: BarChart2,
    title: 'Health and training, side by side',
    copy: 'Steps, sleep, heart rate, and calories sit next to your training totals, so the whole picture makes sense in one place.',
    bullets: [
      'Switch between Health and Stats',
      'Log steps, sleep, heart rate, and calories',
      'Tap a range chip to redraw the activity chart',
    ],
  },
  {
    key: 'workouts',
    label: 'Workouts',
    icon: Dumbbell,
    title: 'Find your next session',
    copy: 'Search the library and narrow it down by type, difficulty, and muscle group. Every card shows the time and effort before you start.',
    bullets: [
      'Search workouts by name',
      'Filter by type, difficulty, and muscle group',
      'Plan and build your own sessions',
    ],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    title: 'Make the app yours',
    copy: 'Your goal, level, and preferred training sit above your all-time totals, with a wallpaper you can switch in one tap.',
    bullets: [
      'See your all-time totals at a glance',
      'Review your goal, level, and preferences',
      'Tap Dark mode, White mode, or Gradient to change the wallpaper',
    ],
  },
]

// Keys the in-phone bottom bar can send, mapped to demo tabs.
const NAV_TO_TAB = { home: 'home', insights: 'insights', workouts: 'workouts', profile: 'profile' }

const THEME_LABELS = { cosmic: 'Dark mode', alabaster: 'White mode', gradient: 'Gradient' }

// Premium-feature previews, deep-linkable by key. The title is used for the
// preview heading.
const PREVIEWS = {
  barcode: { title: 'Barcode scanning' },
  'form-check': { title: 'Form check' },
  ai: { title: 'Uttar AI' },
}

export default function Demo() {
  // Demo is public: always show the alabaster wallpaper, never the saved one.
  usePublicWallpaper()
  usePageMeta({
    title: 'Try the Uttar Fitness demo — no account needed',
    description: 'Tap through a live demo of Uttar Fitness: your home screen, health and stats, the workout library, and your profile. Nothing is saved until you sign in.',
    path: '/demo',
  })
  const { user } = useAuth()
  const [tab, setTab] = useState('home')
  const [workoutDone, setWorkoutDone] = useState(false)
  const [insightsView, setInsightsView] = useState('health')
  const [healthTab, setHealthTab] = useState('overview')
  const [statsRange, setStatsRange] = useState('1M')
  const [workoutSearch, setWorkoutSearch] = useState('')
  const [workoutType, setWorkoutType] = useState('All')
  const [workoutDifficulty, setWorkoutDifficulty] = useState('All')
  const [workoutMuscle, setWorkoutMuscle] = useState('All')
  const [theme, setTheme] = useState('cosmic')
  const [playerTitle, setPlayerTitle] = useState('Core Crusher')
  const [searchParams, setSearchParams] = useSearchParams()
  const tabRefs = useRef({})
  const previewRef = useRef(null)

  // The premium-feature previews are deep-linkable so a reviewer can be handed
  // a direct URL: /demo?preview=barcode, /demo?preview=form-check, and
  // /demo?preview=ai open straight to that screen. The URL is the source of truth.
  const previewParam = searchParams.get('preview')
  const preview = PREVIEWS[previewParam] ? previewParam : null
  const setPreview = useCallback((next) => {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('preview', next)
    else params.delete('preview')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!preview) return
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [preview])

  const copyPreviewLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Deep link copied.')
    } catch {
      toast.message(window.location.href)
    }
  }

  const active = TABS.find((item) => item.key === tab) ?? TABS[0]
  const ActiveIcon = active.icon

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

  const handleNavigate = (key) => {
    if (typeof key === 'string' && key.startsWith('workout:')) {
      setPlayerTitle(key.slice('workout:'.length))
      setTab('player')
      return
    }
    if (NAV_TO_TAB[key]) {
      setTab(NAV_TO_TAB[key])
      return
    }
    if (key === 'ai') toast.message('Uttar AI opens as a full-screen AI coach in the app.')
    else if (key === 'plan') toast.message('The weekly plan opens from the Plan quick link.')
    else if (key === 'run') toast.message('The run tracker is built into the app.')
    else toast.message('That screen opens in the full app.')
  }

  const handleTheme = (key) => {
    setTheme(key)
    toast.message(`Wallpaper set to ${THEME_LABELS[key] || key}.`)
  }

  const resetDemo = () => {
    setTab('home')
    setWorkoutDone(false)
    setInsightsView('health')
    setHealthTab('overview')
    setStatsRange('1M')
    setWorkoutSearch('')
    setWorkoutType('All')
    setWorkoutDifficulty('All')
    setWorkoutMuscle('All')
    setTheme('cosmic')
    setPlayerTitle('Core Crusher')
    setPreview(null)
    toast.message('Demo reset. Nothing was saved.')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Wallpaper />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Back to the Uttar Fitness overview">
            <BrandMark className="h-9 w-9 rounded-xl" emblemClassName="w-6" />
            <span className="text-sm font-black tracking-tight">Uttar Fitness</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" aria-label="Back to the overview" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Overview</span>
            </Link>
            {user
              ? <Link to="/home" className="inline-flex h-10 items-center rounded-xl bg-[hsl(var(--accent-solid))] px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-95">Dashboard</Link>
              : <Link to="/login" className="inline-flex h-10 items-center rounded-xl bg-[hsl(var(--accent-solid))] px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-95">Sign in</Link>}
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
            Tap through the real screens. Complete a workout, switch between Health and Stats, filter the workout library, and preview the wallpaper picker. Sign in only when you want to keep your own data.
          </p>
        </div>

        <section
          aria-labelledby="demo-scope-title"
          className="mt-10 rounded-3xl border border-border/50 bg-card/60 p-5 backdrop-blur-md sm:p-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">What&rsquo;s interactive in this demo</p>
          <h2 id="demo-scope-title" className="mt-2 text-lg font-black leading-tight sm:text-xl">Know what you can tap before you start</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The one reason to come back is the guided workout player — timers, sets, rest, and optional voice cues so you&rsquo;re not counting reps in your head. Everything else feeds into it. Here&rsquo;s what this no-account demo covers.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--success-text))]">
                <Check className="h-4 w-4" /> Fully interactive
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>Home — complete the sample workout</li>
                <li>Insights — switch Health/Stats, log a day, change the range</li>
                <li>Workouts — search and filter the library</li>
                <li>Profile — preview Dark mode, White mode, and Gradient wallpapers</li>
              </ul>
            </div>

            <div className="flex flex-col rounded-2xl border border-border/50 bg-background/40 p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-primary" /> Premium Features
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>Uttar AI — ask it preloaded questions</li>
                <li>Barcode scanning — every state, including no match</li>
                <li>Form check — what it can and can&rsquo;t detect</li>
              </ul>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPreview('ai')}
                  className="inline-flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--accent-text))] transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  Open Uttar AI preview <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreview('barcode')}
                  className="inline-flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--accent-text))] transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  Open barcode preview <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreview('form-check')}
                  className="inline-flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--accent-text))] transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  Open form-check preview <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                Free for everyone while we&rsquo;re in beta.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Lock className="h-4 w-4 text-primary" /> Needs the signed-in app
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>Real sessions and the guided player</li>
                <li>GPS run tracking with maps</li>
                <li>Uttar AI using your history</li>
                <li>Saving your data, offline sync, and account persistence</li>
              </ul>
            </div>
          </div>
        </section>

        {preview ? (
          <div ref={previewRef} id="demo-preview" className="mt-8 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">Premium feature preview</p>
                <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">{PREVIEWS[preview].title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyPreviewLink}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Link2 className="h-4 w-4" /> Copy link
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to the demo
                </button>
              </div>
            </div>
            <div className="mt-5">
              {preview === 'barcode' && <BarcodePreview />}
              {preview === 'form-check' && <FormCheckPreview />}
              {preview === 'ai' && <AIPreview />}
            </div>
          </div>
        ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div>
            <div
              role="tablist"
              aria-label="Demo screens"
              tabIndex={-1}
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
                    onClick={() => setTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:text-sm ${selected ? 'bg-[hsl(var(--accent-solid))] text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>

            <DemoFrame active={tab === 'player' ? null : tab} onNavigate={handleNavigate} theme={theme}>
              <div
                role="tabpanel"
                id={`demo-panel-${tab}`}
                {...(tab === 'player'
                  ? { 'aria-label': 'Demo workout player' }
                  : { 'aria-labelledby': `demo-tab-${tab}` })}
                tabIndex={0}
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {tab === 'home' && (
                  <HomeMock done={workoutDone} onToggleDone={toggleWorkout} onNavigate={handleNavigate} />
                )}
                {tab === 'insights' && insightsView === 'health' && (
                  <InsightsHealthMock
                    view="health"
                    onView={setInsightsView}
                    tab={healthTab}
                    onTab={setHealthTab}
                    onLog={() => toast.message('In the app this opens the health log sheet.')}
                  />
                )}
                {tab === 'insights' && insightsView === 'stats' && (
                  <InsightsStatsMock view="stats" onView={setInsightsView} range={statsRange} onRange={setStatsRange} />
                )}
                {tab === 'workouts' && (
                  <WorkoutsMock
                    search={workoutSearch}
                    onSearch={setWorkoutSearch}
                    type={workoutType}
                    onType={setWorkoutType}
                    difficulty={workoutDifficulty}
                    onDifficulty={setWorkoutDifficulty}
                    muscle={workoutMuscle}
                    onMuscle={setWorkoutMuscle}
                  />
                )}
                {tab === 'profile' && <ProfileMock theme={theme} onTheme={handleTheme} />}
                {tab === 'player' && (
                  <WorkoutPlayerMock title={playerTitle} onExit={() => setTab('home')} />
                )}
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
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">What you&rsquo;re seeing</p>
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
                <Link to="/home" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent-solid))] px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-95">
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
        )}
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
