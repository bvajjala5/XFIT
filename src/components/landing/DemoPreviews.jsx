import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  Keyboard,
  Loader2,
  MessageCircle,
  Play,
  RotateCcw,
  ScanBarcode,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react'

/**
 * Read-only previews of the app's premium features: barcode scanning, form
 * check, and Uttar AI. None of them can run in the no-account demo — the
 * camera features need a signed-in session and a camera, and Uttar AI needs an
 * API key — so these show exactly what each screen looks like and what it does.
 * The AI preview answers a fixed set of preloaded questions offline and never
 * calls the AI proxy.
 */

function PreviewPhone({ children, label }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]" role="img" aria-label={label}>
      <div className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-1.5 shadow-[0_35px_90px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="h-[470px] overflow-hidden rounded-[2rem] border border-border/50 bg-black">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Barcode scanner ───────────────────────────────────────────────────────
function ScannerShell({ children, footer }) {
  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
      <div className="relative z-10 flex items-center justify-between p-3">
        <div className="flex items-center gap-1.5">
          <ScanBarcode className="h-4 w-4" />
          <span className="text-xs font-semibold">Scan barcode</span>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <X className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">{children}</div>
      <div className="relative z-10 p-4 text-center">
        <p className="text-[10px] leading-relaxed text-white/70">{footer}</p>
      </div>
    </div>
  )
}

function Viewfinder() {
  return (
    <div className="relative h-32 w-full max-w-[190px] overflow-hidden rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
      <span className="scanner-line absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.9)]" />
      <span className="absolute left-2.5 top-2.5 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-white" />
      <span className="absolute right-2.5 top-2.5 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-white" />
      <span className="absolute bottom-2.5 left-2.5 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-white" />
      <span className="absolute bottom-2.5 right-2.5 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-white" />
    </div>
  )
}

/** Decorative, non-interactive button — the preview is read-only. */
function MockButton({ children, tone = 'solid', icon: Icon }) {
  const cls = tone === 'solid'
    ? 'bg-white text-black'
    : 'bg-white/12 text-white backdrop-blur-md'
  return (
    <span className={`flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ${cls}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  )
}

const BARCODE_STATES = {
  scanning: {
    tab: 'Scanning',
    title: 'Scanning for a barcode',
    body: 'A viewfinder with a moving scan line shows the camera is actively looking. The hint tells you to fill the frame and hold steady. There is always a manual-entry escape hatch below.',
  },
  found: {
    tab: 'Match',
    title: 'Match found',
    body: 'A recognised product shows its name, brand, and calories and macros per 100 g, then opens the amount screen. Nothing is logged until you confirm the amount.',
  },
  'no-match': {
    tab: 'No match',
    title: 'No match',
    body: "When the code isn't in Open Food Facts the app says so plainly and offers three ways forward: scan another, search by name, or type the code in by hand.",
  },
  blocked: {
    tab: 'Camera unavailable',
    title: 'Camera unavailable',
    body: 'If the camera is blocked or already in use, the app explains how to fix it and still lets you log the food by typing the code or searching by name.',
  },
  manual: {
    tab: 'Manual entry',
    title: 'Enter it manually',
    body: 'Type the digits printed under the barcode. This is the fallback for a damaged label, an unknown product, or a device with no usable camera.',
  },
}

const BARCODE_TABS = ['scanning', 'found', 'no-match', 'blocked', 'manual']

function BarcodeScreen({ state }) {
  if (state === 'scanning') {
    return <ScannerShell footer="Point the camera at the barcode on the package and hold steady."><Viewfinder /></ScannerShell>
  }
  if (state === 'found') {
    return (
      <ScannerShell footer="Found it — taking you to the amount screen.">
        <div className="w-full max-w-[210px] rounded-2xl bg-black/75 p-4 text-center backdrop-blur-md">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Match found</p>
          <p className="mt-1 text-sm font-bold leading-tight">Greek Yogurt, plain</p>
          <p className="text-[10px] text-white/60">Example brand</p>
          <div className="mt-2.5 grid grid-cols-4 gap-1 text-[9px]">
            {[['kcal', 59], ['prot', 10], ['carb', 3.6], ['fat', 0.4]].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/10 py-1">
                <p className="font-bold tabular-nums">{value}</p>
                <p className="text-white/55">{label}</p>
              </div>
            ))}
          </div>
          <span className="mt-3 flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">Add to log</span>
          <p className="mt-1.5 text-[9px] text-white/45">Per 100 g</p>
        </div>
      </ScannerShell>
    )
  }
  if (state === 'no-match') {
    return (
      <ScannerShell footer="You can always search by name or type the code in by hand.">
        <div className="w-full max-w-[210px] rounded-2xl bg-black/75 p-4 text-center backdrop-blur-md">
          <ScanBarcode className="mx-auto h-7 w-7 text-white/60" />
          <p className="mt-1.5 text-sm font-semibold">No match for that code</p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/70">Not every product is in the database yet.</p>
          <div className="mt-3 space-y-1.5">
            <MockButton icon={RotateCcw}>Scan another</MockButton>
            <MockButton tone="ghost" icon={Search}>Search by name</MockButton>
            <MockButton tone="ghost" icon={Keyboard}>Enter it manually</MockButton>
          </div>
        </div>
      </ScannerShell>
    )
  }
  if (state === 'blocked') {
    return (
      <ScannerShell footer="No camera? You can still log the food by hand.">
        <div className="w-full max-w-[210px] rounded-2xl bg-black/75 p-4 text-center backdrop-blur-md">
          <CameraOff className="mx-auto h-7 w-7 text-white/60" />
          <p className="mt-1.5 text-sm font-semibold">Camera unavailable</p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/70">Allow camera access for this site in your browser settings, then try again.</p>
          <div className="mt-3 space-y-1.5">
            <MockButton icon={RotateCcw}>Try the camera again</MockButton>
            <MockButton tone="ghost" icon={Keyboard}>Enter the barcode manually</MockButton>
            <MockButton tone="ghost" icon={Search}>Search by name instead</MockButton>
          </div>
        </div>
      </ScannerShell>
    )
  }
  return (
    <ScannerShell footer="You can always search by name or type the code in by hand.">
      <div className="w-full max-w-[210px] rounded-2xl bg-black/80 p-4 text-center backdrop-blur-md">
        <Keyboard className="mx-auto h-6 w-6 text-white/70" />
        <p className="mt-1.5 text-sm font-semibold">Type the barcode</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/60">The digits printed under the barcode.</p>
        <div className="mt-2.5 h-9 w-full rounded-lg border border-white/20 bg-white/10 px-2 text-center text-sm font-semibold leading-9 tracking-[0.15em] text-white/70">5000112637922</div>
        <div className="mt-2.5 space-y-1.5">
          <MockButton icon={Search}>Look up</MockButton>
          <MockButton tone="ghost">Use the camera instead</MockButton>
        </div>
      </div>
    </ScannerShell>
  )
}

export function BarcodePreview() {
  const [state, setState] = useState('scanning')
  const active = BARCODE_STATES[state]
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {BARCODE_TABS.map((key) => {
          const selected = key === state
          return (
            <button
              key={key}
              type="button"
              onClick={() => setState(key)}
              aria-pressed={selected}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${selected ? 'bg-[hsl(var(--accent-solid))] text-primary-foreground shadow-sm' : 'bg-secondary/70 text-muted-foreground hover:text-foreground'}`}
            >
              {BARCODE_STATES[key].tab}
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <BarcodeScreen state={state} />
        <div className="rounded-3xl border border-border/50 bg-card/60 p-5 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">State preview</p>
          <h3 className="mt-2 text-lg font-black leading-tight">{active.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.body}</p>
          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-border/50 bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Tap the state buttons above to step through each screen. This preview is read-only — the real scanner needs a signed-in session and camera access.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Form check ────────────────────────────────────────────────────────────
export function FormCheckPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <PreviewPhone label="Preview of the Uttar Fitness form check screen">
        <div className="relative flex h-full flex-col bg-black text-white">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />
          <div className="relative z-10 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">Form check</p>
            <p className="text-sm font-bold">Goblet Squat</p>
          </div>
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-4">
            <div className="relative h-[150px] w-full rounded-[1.5rem] border border-white/25 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.14),transparent_70%)]">
              <span className="absolute left-3 top-3 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
              <span className="absolute right-3 top-3 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
              <span className="absolute bottom-3 left-3 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
              <span className="absolute bottom-3 right-3 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-primary" />
            </div>
            <div className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-left">
              <p className="text-[10px] font-semibold text-white/85">What the coach can and can&rsquo;t do</p>
              <p className="mt-1 text-[9px] leading-relaxed text-white/60">Flags body position, alignment, range of motion, stance, and safety risks. Can&rsquo;t feel weight, judge tempo, or diagnose injury.</p>
            </div>
          </div>
          <div className="relative z-10 space-y-2 p-4">
            <span className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-bold text-black">
              <Play className="h-4 w-4" fill="currentColor" /> Start live check
            </span>
            <p className="flex items-center justify-center gap-1.5 text-[9px] text-white/45">
              <ShieldCheck className="h-2.5 w-2.5 shrink-0" /> Frames are checked on the fly and never stored.
            </p>
          </div>
        </div>
      </PreviewPhone>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">What it checks</p>
          <h3 className="mt-2 text-lg font-black leading-tight">A second pair of eyes — not a verdict</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The form checker looks at one camera frame at a time and calls out the single most useful correction. It is deliberately honest about its limits so its feedback is never taken as definitive.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--success-text))]">
              <Check className="h-4 w-4" /> It can reliably flag
            </p>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>Body position and joint alignment</li>
              <li>Range of motion on the rep you&rsquo;re doing</li>
              <li>Stance and setup before you move</li>
              <li>Obvious safety risks the camera can see</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-400/25 bg-amber-400/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--warn-text))]">
              <AlertTriangle className="h-4 w-4" /> It can&rsquo;t reliably judge
            </p>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>How heavy the weight is or how hard you&rsquo;re pushing</li>
              <li>Tempo and rep speed from a single frame</li>
              <li>Anything hidden by loose clothing, bad light, or a cropped frame</li>
              <li>Pain, injury, or medical conditions — it never diagnoses</li>
            </ul>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-2xl border border-border/50 bg-card/60 p-3.5 text-xs leading-relaxed text-muted-foreground backdrop-blur-md">
          <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          The form checker needs a signed-in session and camera access, so it is outside the no-account demo. Treat every cue as guidance and stop if something hurts.
        </p>
      </div>
    </div>
  )
}

// ── Uttar AI ──────────────────────────────────────────────────────────────
// The demo has no account and no API key, so this preview answers a fixed set
// of preloaded questions with canned replies. Nothing here calls the AI proxy.
const AI_QUESTIONS = [
  {
    id: 'workout',
    icon: Dumbbell,
    title: 'Build a workout',
    prompt: '20-minute full-body workout, no equipment, beginner friendly',
    answer: {
      kind: 'workout',
      workout: {
        name: '20-Minute Full-Body',
        estimated_duration: 20,
        estimated_calories: 190,
        difficulty: 'beginner',
        exercises: [
          { name: 'Bodyweight squat', sets: 3, reps: '12', rest_seconds: 45, notes: 'Chest up, sit back' },
          { name: 'Incline push-up', sets: 3, reps: '10', rest_seconds: 45, notes: 'Hands on a bench' },
          { name: 'Reverse lunge', sets: 3, reps: '10 per leg', rest_seconds: 45, notes: 'Step back, tall torso' },
          { name: 'Glute bridge', sets: 3, reps: '15', rest_seconds: 40, notes: 'Squeeze at the top' },
          { name: 'Dead bug', sets: 3, reps: '10 per side', rest_seconds: 40, notes: 'Ribs down, slow' },
          { name: 'Plank', sets: 3, reps: '30s', rest_seconds: 40, notes: 'Straight line, breathe' },
        ],
      },
    },
  },
  {
    id: 'plan',
    icon: CalendarDays,
    title: 'Make a weekly plan',
    prompt: '4-day upper/lower plan for fat loss, 45 minutes per session',
    answer: {
      kind: 'plan',
      days: [
        { day: 'Mon', title: 'Upper body A', minutes: 45 },
        { day: 'Tue', title: 'Lower body A', minutes: 45 },
        { day: 'Wed', title: 'Rest', isRest: true },
        { day: 'Thu', title: 'Upper body B', minutes: 45 },
        { day: 'Fri', title: 'Lower body B', minutes: 45 },
        { day: 'Sat', title: 'Rest', isRest: true },
        { day: 'Sun', title: 'Rest', isRest: true },
      ],
    },
  },
  {
    id: 'nutrition',
    icon: Utensils,
    title: 'Nutrition help',
    prompt: 'High-protein breakfast ideas under 400 calories',
    answer: {
      kind: 'text',
      intro: 'Four high-protein breakfasts, each under 400 calories:',
      bullets: [
        'Greek yogurt bowl — 200 g yogurt, berries, 1 tbsp chia · ~24 g protein, 320 cal',
        'Veggie omelette — 3 eggs, spinach, tomato, feta · ~22 g protein, 350 cal',
        'Overnight oats — 40 g oats, 150 g yogurt, a scoop of whey · ~30 g protein, 390 cal',
        'Cottage cheese on toast — 150 g cottage cheese, one slice · ~20 g protein, 300 cal',
      ],
      outro: 'Log any of them from Insights → Nutrition to track the macros automatically.',
    },
  },
  {
    id: 'recovery',
    icon: Activity,
    title: 'Ask about recovery',
    prompt: 'How should I train when my legs are still sore?',
    answer: {
      kind: 'text',
      intro: 'Sore legs mean back off the intensity, not stop moving:',
      bullets: [
        'Keep moving — a 20–30 minute walk or easy cycle boosts blood flow and eases soreness',
        'Train around it — upper body or core work is fine while your legs recover',
        'If you do train legs, cut the load by about half and stop 3–4 reps short of failure',
        'Recover on purpose — sleep, 1.6–2.2 g of protein per kg, and plenty of water',
      ],
      outro: 'Sharp pain, swelling, or dark urine is different — stop and see a clinician.',
    },
  },
  {
    id: 'theme',
    icon: Compass,
    title: 'Find a feature',
    prompt: 'How do I change my wallpaper?',
    answer: {
      kind: 'text',
      intro: 'You can change it in two taps:',
      bullets: [
        'Open Profile from the bottom bar',
        'Pick Cosmic, Alabaster, or Gradient',
      ],
      outro: 'Gradient blends any two colors you choose. Nothing follows the clock anymore.',
      actions: [{ label: 'Change wallpaper' }],
    },
  },
  {
    id: 'history',
    icon: Activity,
    title: 'Where is my history?',
    prompt: 'Where can I see my workout history?',
    answer: {
      kind: 'text',
      intro: 'Your finished sessions live in two places:',
      bullets: [
        'Workout history — every completed session, with duration and volume',
        'Insights → Stats — trends for volume, sets, and streaks over time',
      ],
      outro: 'Personal records get their own page too.',
      actions: [{ label: 'Open workout history' }],
    },
  },
]

function AIWorkoutCard({ workout }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card/70">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{workout.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" />{workout.exercises.length} exercises</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{workout.estimated_duration} min</span>
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />~{workout.estimated_calories} cal</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">{workout.difficulty}</span>
      </div>
      <ol className="max-h-48 divide-y divide-border/30 overflow-y-auto">
        {workout.exercises.map((ex, i) => (
          <li key={`${ex.name}-${i}`} className="flex gap-2.5 px-3 py-2 text-xs">
            <span className="mt-0.5 w-3 shrink-0 font-semibold text-[hsl(var(--accent-text))]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground">{ex.sets} × {ex.reps} · rest {ex.rest_seconds}s</p>
              {ex.notes ? <p className="mt-0.5 text-[10px] text-muted-foreground">{ex.notes}</p> : null}
            </div>
          </li>
        ))}
      </ol>
      <div className="border-t border-border/40 p-2.5">
        <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--accent-solid))] px-3 py-2 text-xs font-semibold text-primary-foreground">
          <Play className="h-3.5 w-3.5" fill="currentColor" /> Save workout
        </span>
      </div>
    </div>
  )
}

function AIPlanCard({ days }) {
  const training = days.filter((day) => !day.isRest).length
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card/70">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 p-3">
        <div>
          <p className="text-sm font-bold">Your weekly plan</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{training} training days · {7 - training} rest days</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">AI plan</span>
      </div>
      <div className="divide-y divide-border/30">
        {days.map((day) => (
          <div key={day.day} className="flex items-center gap-3 px-3 py-1.5 text-xs">
            <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{day.day}</span>
            <span className={`min-w-0 flex-1 truncate ${day.isRest ? 'text-muted-foreground' : 'font-medium'}`}>{day.title}</span>
            {day.isRest
              ? <span className="text-[10px] text-muted-foreground">Rest</span>
              : <span className="shrink-0 text-[10px] text-muted-foreground">{day.minutes} min</span>}
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 p-2.5">
        <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--accent-solid))] px-3 py-2 text-xs font-semibold text-primary-foreground">
          <Check className="h-3.5 w-3.5" /> Apply to my Plan
        </span>
      </div>
    </div>
  )
}

function AITextAnswer({ answer }) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed">{answer.intro}</p>
      {answer.bullets?.length ? (
        <ul className="space-y-1.5">
          {answer.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--accent-text))]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {answer.outro ? <p className="text-xs leading-relaxed text-muted-foreground">{answer.outro}</p> : null}
      {answer.actions?.length ? (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {answer.actions.map((action) => (
            <span key={action.label} className="inline-flex items-center gap-1.5 rounded-xl border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--accent-text))]">
              <ArrowUpRight className="h-3 w-3" /> {action.label}
              <span className="sr-only"> (opens in the app)</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AIPreview() {
  const [thread, setThread] = useState([])
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread, busy])

  const ask = (question) => {
    if (busy || thread.some((message) => message.qid === question.id)) return
    setThread((prev) => [...prev, { id: `q-${question.id}`, role: 'user', qid: question.id, content: question.prompt }])
    setBusy(true)
    timerRef.current = setTimeout(() => {
      setThread((prev) => [...prev, { id: `a-${question.id}`, role: 'assistant', qid: question.id, answer: question.answer }])
      setBusy(false)
    }, 550)
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    setBusy(false)
    setThread([])
  }

  const remaining = AI_QUESTIONS.filter((question) => !thread.some((message) => message.qid === question.id))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 p-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black">Uttar AI</p>
              <p className="truncate text-[10px] text-muted-foreground">Your coach for training, nutrition, and recovery</p>
            </div>
          </div>
          {thread.length ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          ) : null}
        </div>

        <div ref={scrollRef} className="h-[380px] space-y-3.5 overflow-y-auto p-3.5">
          <div className="rounded-2xl border border-border/50 bg-background/50 p-3 text-sm leading-relaxed">
            Hey — I can answer health and nutrition questions, build a single workout, or set up your whole week. Pick a question below to see how I reply.
          </div>

          {thread.map((message) => (
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[hsl(var(--accent-solid))] px-3 py-2 text-xs text-primary-foreground">{message.content}</div>
              </div>
            ) : (
              <div key={message.id} className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> Uttar AI
                </p>
                {message.answer.kind === 'workout' ? <AIWorkoutCard workout={message.answer.workout} />
                  : message.answer.kind === 'plan' ? <AIPlanCard days={message.answer.days} />
                    : <AITextAnswer answer={message.answer} />}
              </div>
            )
          ))}

          {busy ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/50 px-3 py-2.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          ) : null}

          {remaining.length ? (
            <div className="space-y-2 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {remaining.map((question) => {
                  const Icon = question.icon
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => ask(question)}
                      disabled={busy}
                      className="rounded-2xl border border-border/50 bg-card/50 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" /> {question.title}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{question.prompt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/40 bg-background/40 p-3" aria-hidden="true">
          <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
            {[['Chat', MessageCircle, true], ['Workout', Dumbbell, false], ['Weekly plan', CalendarDays, false]].map(([label, Icon, active]) => (
              <span key={label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                <Icon className={`h-3 w-3 shrink-0 ${active ? 'text-primary' : ''}`} /> {label}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="min-h-[40px] flex-1 rounded-xl border border-border/50 px-3 py-2.5 text-[11px] text-muted-foreground">Ask about training, nutrition, recovery, or form…</span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[hsl(var(--accent-solid))] px-3 text-[11px] font-semibold text-primary-foreground"><Send className="h-3.5 w-3.5" /> Send</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--accent-text))]">What it does</p>
          <h3 className="mt-2 text-lg font-black leading-tight">Ask in plain language, get a plan back</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Uttar AI is the coach built into the app. It reads your profile, training history, and nutrition log, then answers in plain language — or builds something you can save.
          </p>
        </div>

        <ul className="space-y-2">
          {[
            'Chat — training, nutrition, recovery, and where things live in the app',
            'Build a workout — one session you can save and start',
            'Weekly plan — a full week you can apply to your Plan page',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-2 rounded-2xl border border-border/50 bg-card/60 p-3.5 text-xs leading-relaxed text-muted-foreground backdrop-blur-md">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          This preview answers a fixed set of questions offline so you can see the shape of it. The real coach uses your own history and needs a signed-in account.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          AI can make mistakes — check form and safety, and talk to a clinician about injuries or medical conditions.
        </p>
      </div>
    </div>
  )
}
