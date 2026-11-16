import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Keyboard,
  Play,
  RotateCcw,
  ScanBarcode,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

/**
 * Read-only previews of the two camera features. Neither can run in the
 * no-account demo (they need a signed-in session and a camera), so these show
 * exactly what each screen looks like and what it does — including the states
 * people asked to see and the limits of form-check feedback.
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">State preview</p>
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">What it checks</p>
          <h3 className="mt-2 text-lg font-black leading-tight">A second pair of eyes — not a verdict</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The form checker looks at one camera frame at a time and calls out the single most useful correction. It is deliberately honest about its limits so its feedback is never taken as definitive.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
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
