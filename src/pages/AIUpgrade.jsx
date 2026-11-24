import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { AlertCircle, ArrowLeft, Check, Loader2, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'
import BrandMark from '@/components/brand/BrandMark'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { fetchAIUsage, startAIUpgrade } from '@/lib/ai'
import { track } from '@/lib/usageAnalytics'

function resetLabel(resetAt) {
  if (!resetAt) return 'when your plan renews'
  const date = new Date(resetAt)
  if (Number.isNaN(date.getTime())) return 'when your plan renews'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function UsageBar({ label, used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const PLANS = [
  {
    id: 'pro',
    name: 'Uttar AI Pro',
    tagline: 'A bigger monthly allowance for daily coaching',
    badge: 'Monthly',
    features: ['Higher monthly request and token limits', 'Chat, workout and weekly-plan building', 'Live form-check frames', 'Cancel anytime from Stripe'],
  },
  {
    id: 'topup-small',
    name: 'AI credit pack · Small',
    tagline: 'Add a top-up to this month',
    badge: 'One-time',
    features: ['Extra requests for the current month', 'Extra tokens for longer answers', 'Keeps your free plan', 'No subscription'],
  },
  {
    id: 'topup-large',
    name: 'AI credit pack · Large',
    tagline: 'For a heavier training block',
    badge: 'One-time',
    features: ['A larger one-time allowance', 'Works with Free or Pro', 'Applied immediately after payment', 'No subscription'],
  },
]

export default function AIUpgrade() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isNative = Capacitor?.isNativePlatform?.() === true
  const [usage, setUsage] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetchAIUsage().then((result) => { if (alive) setUsage(result) })
    track('ai_upgrade_viewed', { placement: 'page', platform: isNative ? 'android' : 'web' })
    return () => { alive = false }
  }, [isNative])

  async function buy(kind) {
    if (!user || busy || isNative) return
    setBusy(kind)
    setError('')
    try {
      const url = await startAIUpgrade(kind)
      window.location.assign(url)
    } catch (err) {
      setError(err?.message || 'Could not start checkout. Please try again.')
      toast.error('Could not start checkout')
      setBusy('')
    }
  }

  const status = params.get('status')

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-10 md:p-8">
      <button
        type="button"
        onClick={() => navigate('/home', { state: { openAI: true } })}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Uttar AI
      </button>

      <div className="flex items-center gap-3">
        <BrandMark className="h-12 w-12 rounded-2xl shadow-lg shadow-black/20" emblemClassName="w-8" />
        <div>
          <h1 className="text-2xl font-black">More Uttar AI</h1>
          <p className="text-sm text-muted-foreground">Upgrade for a bigger allowance, or top up only when you need it.</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Payment received</p>
            <p className="text-xs text-muted-foreground">Your allowance is being applied. It should appear in Uttar AI shortly.</p>
          </div>
        </div>
      ) : null}
      {status === 'cancelled' ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 text-sm text-muted-foreground">
          Checkout was cancelled. Nothing was charged.
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your current allowance</h2>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            {usage?.plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
        {usage ? (
          <div className="space-y-3">
            <UsageBar label="Requests" used={usage.requestsUsed || 0} limit={usage.requestsLimit || 0} />
            <UsageBar label="Tokens" used={usage.tokensUsed || 0} limit={usage.tokensLimit || 0} />
            <p className="text-[11px] text-muted-foreground">
              Resets {resetLabel(usage.periodEnd)}. All other Uttar Fitness features stay free.
            </p>
            {usage.persisted === false ? (
              <p className="text-[11px] text-amber-300/80">
                Usage tracking is not enabled on the server yet, so this is the included allowance rather than a live count.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your AI proxy is not connected yet. The coach is running in local preview mode.
          </p>
        )}
      </GlassCard>

      {isNative ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Purchases are not enabled in this Android build yet.</p>
          <p className="mt-1">
            While the app is in Play review, Uttar AI top-ups are available on the web version only. No in-app payment is enabled here.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {PLANS.map((plan) => (
          <GlassCard key={plan.id} className="flex flex-col space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.tagline}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">{plan.badge}</span>
            </div>
            <ul className="flex-1 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-[11px] leading-relaxed text-foreground/75">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-xl"
              disabled={Boolean(busy) || isNative || !user}
              onClick={() => buy(plan.id)}
            >
              {busy === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              {isNative ? 'Web only' : 'Continue to checkout'}
            </Button>
          </GlassCard>
        ))}
      </div>

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Prices are shown at Stripe checkout. Payments are processed by Stripe; Uttar Fitness never stores card details.
        Requesting more Uttar AI is optional — every other feature stays free.
      </p>
    </div>
  )
}
