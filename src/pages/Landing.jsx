import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Play,
  Sparkles,
  Utensils,
} from 'lucide-react'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import BrandMark from '@/components/brand/BrandMark'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import useAutoTheme from '@/hooks/useAutoTheme'
import usePageMeta from '@/hooks/usePageMeta'
import {
  DashboardMock,
  PhoneFrame,
  PREVIEW_SCREENS,
  WorkoutMock,
} from '@/components/landing/AppMocks'

const PRIMARY_BUTTON = 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
const SECONDARY_BUTTON = 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-6 text-sm font-semibold text-foreground backdrop-blur-md transition-all hover:bg-secondary/70 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Today, decided',
    copy: 'Your next workout, your streak, and your check-in on one calm screen. Open the app and know exactly what to do.',
    detail: 'One clear next step',
  },
  {
    icon: CalendarDays,
    title: 'Plans that bend',
    copy: 'Set a weekly split once, then move a day when life happens. The rest of the week reflows with you.',
    detail: 'Presets or build your own',
  },
  {
    icon: Dumbbell,
    title: 'Workouts with a coach',
    copy: 'Timers, sets, rest, and AI form cues stay on screen while you train — no counting reps in your head.',
    detail: 'Guided player + form checks',
  },
  {
    icon: Utensils,
    title: 'Food without the friction',
    copy: 'Search foods, scan barcodes, and track calories and macros in seconds. Your diary stays out of the way.',
    detail: 'Barcode + macro tracking',
  },
  {
    icon: HeartPulse,
    title: 'Health in context',
    copy: 'Sleep, steps, weight, heart rate, and recovery sit beside your training, so the whole picture makes sense.',
    detail: 'One health timeline',
  },
  {
    icon: LineChart,
    title: 'Progress you can feel',
    copy: 'Streaks, personal records, and weekly charts show the work adding up — even on the weeks motivation dips.',
    detail: 'Trends, not just totals',
  },
]

const STEPS = [
  { title: 'Sign in with Google', copy: 'One tap. No passwords, no forms, no friction.' },
  { title: 'Pick your split', copy: 'Choose a preset or let Uttar AI build a week around your goals.' },
  { title: 'Show up', copy: 'The app handles the plan, the timer, the food log, and the proof.' },
]

const PREVIEW_LABELS = {
  today: 'Today',
  plan: 'Weekly plan',
  health: 'Health Hub',
  workout: 'Workout player',
}

function Reveal({ children, delay = 0, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      // The generous top margin reveals anything the visitor has already
      // scrolled past, so an instant jump (anchor link, Cmd+End, restored
      // scroll position) never leaves a section stuck at opacity 0.
      viewport={{ once: true, margin: '10000px 0px -10% 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function FloatingCard({ className = '', children, delay = 0 }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`pointer-events-none absolute hidden rounded-2xl border border-border/60 bg-card/90 p-3 shadow-2xl backdrop-blur-xl sm:block ${className}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: [0, -7, 0] }}
      transition={{
        opacity: { duration: 0.5, delay: 0.5 + delay },
        scale: { duration: 0.5, delay: 0.5 + delay },
        y: { duration: 5.5, delay: delay, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  useAutoTheme()
  usePageMeta({
    title: 'Uttar Fitness — Your whole fitness week, in one place',
    description: 'Workouts, weekly plans, nutrition, sleep, health metrics, and AI coaching in one calm app. Try the interactive demo free — no account needed.',
    path: '/',
  })

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground">
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Uttar Fitness home">
            <BrandMark className="h-9 w-9 rounded-xl" emblemClassName="w-6" />
            <span className="text-sm font-black tracking-tight">Uttar Fitness</span>
          </Link>

          <nav aria-label="Landing navigation" className="flex items-center gap-1.5 sm:gap-3">
            <a href="#features" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:inline-flex">
              Features
            </a>
            <a href="#screens" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:inline-flex">
              Inside the app
            </a>
            <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:inline-flex">
              Sign in
            </Link>
            <Link to="/demo" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              Try demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:grid lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-14 lg:pb-28">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Built for people who train for real life
            </span>

            <h1 className="mt-6 text-balance text-[2.75rem] font-black leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-[4.3rem]">
              Your whole fitness week,
              <span className="mt-1 block text-primary">in one place.</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Workouts, nutrition, sleep, and runs come together in one clear weekly plan. An AI coach remembers your history, spots what&rsquo;s working, and keeps the next step obvious.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/demo" className={`group ${PRIMARY_BUTTON}`}>
                Try the live demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <GoogleSignInButton className="sm:w-auto" label="Continue with Google" variant="outline" />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No account needed for the demo · Free to start · Auto light &amp; dark
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground">
              {['Workouts', 'Weekly plan', 'Nutrition', 'Health', 'Uttar AI'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-14 lg:mt-0">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[90px]" />
            <motion.div
              className="relative mx-auto w-full max-w-[340px]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <PhoneFrame label="Preview of the Uttar Fitness dashboard">
                <DashboardMock />
              </PhoneFrame>

              <FloatingCard className="-left-4 top-24" delay={0.2}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <Flame className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold leading-none">7 day streak</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">Consistency wins</p>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard className="-right-5 top-56" delay={0.45}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold leading-none">Week planned</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">5 sessions ready</p>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard className="bottom-16 -left-6" delay={0.65}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold leading-none">Ask Uttar AI</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">&ldquo;Adjust my week&rdquo;</p>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">The whole picture</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-2xl text-balance text-3xl font-black leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Everything you need to keep going.
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Not another feed. Not another spreadsheet. A focused home for the work that actually moves you forward.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, copy, detail }, index) => (
              <Reveal key={title} delay={index * 0.05}>
                <article className="group h-full rounded-3xl border border-border/50 bg-card/55 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/70 hover:shadow-xl hover:shadow-primary/5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                  <p className="mt-4 text-xs font-semibold text-primary/80">{detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Screens ───────────────────────────────────────────── */}
        <section id="screens" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Inside the app</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-2xl text-balance text-3xl font-black leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Built to be used, not admired.
              </h2>
              <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
                Tap through the demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A quick look at the screens you&rsquo;ll live in: today&rsquo;s plan, the week ahead, your health, and the workout player.
            </p>
          </Reveal>

          <div className="mt-10 flex snap-x gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {PREVIEW_SCREENS.map(({ key, label, caption, Component }, index) => (
              <Reveal key={key} delay={index * 0.06} className="min-w-[248px] snap-center lg:min-w-0">
                <div className="mx-auto w-full max-w-[260px]">
                  <PhoneFrame label={`${PREVIEW_LABELS[key] ?? label} screen preview`}>
                    <Component />
                  </PhoneFrame>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Reveal>
            <div className="rounded-[2rem] border border-border/50 bg-card/45 p-6 backdrop-blur-md sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Three steps</p>
                  <h2 className="mt-3 text-balance text-3xl font-black leading-[1.05] tracking-[-0.035em] sm:text-4xl">
                    Start in under a minute.
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    No onboarding maze. No blank dashboard. Sign in, choose how you train, and get a week you can actually follow.
                  </p>
                </div>
                <ol className="grid gap-3 sm:grid-cols-3">
                  {STEPS.map(({ title, copy }, index) => (
                    <li key={title} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="mt-3 text-sm font-bold leading-snug">{title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Demo CTA ──────────────────────────────────────────── */}
        <section id="demo" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/55 p-6 backdrop-blur-xl sm:p-10 lg:p-12">
              <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
              <div aria-hidden="true" className="absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_280px] lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
                    <Play className="h-3 w-3 fill-current" /> Try before you sign up
                  </span>
                  <h2 className="mt-4 text-balance text-3xl font-black leading-[1.02] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                    Kick the tires. No account needed.
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Open the live demo and tap through a sample day: complete a workout, switch training days, log water, and see how the week fits together. Nothing is saved until you create an account.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link to="/demo" className={`group ${PRIMARY_BUTTON}`}>
                      Open the demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link to="/login" className={SECONDARY_BUTTON}>
                      Create a free account
                    </Link>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Takes about two minutes to look around. Sign in only when you want to keep your data.
                  </p>
                </div>

                <div className="relative mx-auto w-full max-w-[280px]">
                  <div aria-hidden="true" className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
                  <div className="relative mx-auto w-full max-w-[260px]">
                    <PhoneFrame label="Preview of the Uttar Fitness workout player">
                      <WorkoutMock />
                    </PhoneFrame>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 text-center sm:px-6">
          <Reveal>
            <div className="flex flex-col items-center">
              <BrandMark className="h-14 w-14 rounded-2xl shadow-xl" emblemClassName="w-10" />
              <h2 className="mt-5 text-balance text-3xl font-black leading-[1.05] tracking-[-0.035em] sm:text-4xl">
                Your next week starts here.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Direct your greatness. Uttar Fitness keeps the plan, the proof, and the next step in one place.
              </p>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link to="/demo" className={`group ${PRIMARY_BUTTON}`}>
                  Try the live demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/login" className={SECONDARY_BUTTON}>
                  Continue with Google
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 rounded-xl" emblemClassName="w-6" />
            <div>
              <p className="text-sm font-black tracking-tight">Uttar Fitness</p>
              <p className="text-[11px] text-muted-foreground">Direct Your Greatness, Live Uttar</p>
            </div>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <Link to="/demo" className="transition-colors hover:text-foreground">Demo</Link>
            <Link to="/login" className="transition-colors hover:text-foreground">Sign in</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </nav>
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Uttar Fitness</p>
        </div>
      </footer>
    </div>
  )
}
