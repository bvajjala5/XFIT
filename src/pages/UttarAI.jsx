import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Dumbbell, CalendarDays, MessageCircle, RotateCcw, X,
  Loader2, Check, Play, Clock, Flame, AlertCircle, Utensils, Activity, Compass, ArrowUpRight,
} from 'lucide-react'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import BrandMark from '@/components/brand/BrandMark'
import BrandLoader from '@/components/brand/BrandLoader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/AuthContext'
import { callAI } from '@/lib/ai'
import { parseAIResponse } from '@/lib/aiPlanParse'
import { saveAIWeeklyPlan, saveAIWorkout } from '@/lib/aiPlans'
import {
  APP_GUIDE, NAV_OUTPUT_RULES, describeLocation, extractNavActions, findNavSuggestions,
} from '@/lib/appNavigation'

const MODES = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'plan', label: 'Weekly plan', icon: CalendarDays },
]

const SUGGESTIONS = [
  { mode: 'workout', icon: Dumbbell, title: 'Build a workout', text: '20-minute full-body workout, no equipment, beginner friendly' },
  { mode: 'plan', icon: CalendarDays, title: 'Make a weekly plan', text: '4-day upper/lower plan for fat loss, 45 minutes per session' },
  { mode: 'chat', icon: Utensils, title: 'Nutrition help', text: 'High-protein breakfast ideas under 400 calories' },
  { mode: 'chat', icon: Activity, title: 'Ask about recovery', text: 'How should I train when my legs are still sore?' },
  { mode: 'chat', icon: Compass, title: 'Find a feature', text: 'How do I change my app theme?' },
  { mode: 'chat', icon: Activity, title: 'Where is my history?', text: 'Where can I see my workout history?' },
]

const CHAT_SYSTEM = `You are Uttar AI, the health and fitness coach inside the Uttar Fitness app.
You help with training, exercise technique, weekly programming, nutrition, hydration, sleep, recovery, and healthy habits.
Style: warm, direct, and practical. Prefer short paragraphs and compact bullet lists. Give specific numbers (sets, reps, minutes, grams, calories) when useful. Ask one clarifying question if the person's goal, experience, equipment, or available time is unclear.
Safety: you are not a doctor. Do not diagnose. For chest pain, fainting, severe shortness of breath, head injury, or suspected fracture, tell them to stop and seek medical care. Pregnancy, eating disorders, and medical conditions need a clinician.
Scope: stay on health and fitness; if asked something unrelated, answer briefly and steer back. Questions about where something is in this app are always in scope.
The app can save workouts and weekly plans. When the person wants one, explain that you can build it and ask them to tap Workout or Weekly plan below. Never output workout JSON in chat mode; the only structured block you may output is the navigation block described below.

You know exactly where everything lives in this app:
${APP_GUIDE}

${NAV_OUTPUT_RULES}`

const WORKOUT_SYSTEM = `You are Uttar AI, a strength and conditioning coach inside the Uttar Fitness app.
Turn the request into ONE workout. Return ONLY a JSON object, with no markdown fences and no prose, in this shape:
{"name":"Workout name","estimated_duration":30,"estimated_calories":250,"difficulty":"beginner|intermediate|advanced","exercises":[{"name":"Exercise","sets":3,"reps":"10","duration_seconds":null,"rest_seconds":45,"notes":"short cue"}]}
Rules:
- 4-10 exercises that fit the requested time, equipment, and experience.
- Use duration_seconds (number) for holds or timed cardio, otherwise null.
- reps is a string: "10", "8-12", "10 per leg", or "to failure".
- rest_seconds must be 0-180. Keep notes under 12 words.
- Respect injuries and limitations the person mentions.
- If they ask for a multi-day or weekly plan, return {"type":"plan","plan":{"Monday":{"type":"workout","workout_title":"...","workout_duration":45,"workout_difficulty":"intermediate","exercises":[...]},"Tuesday":{"type":"rest","label":"Rest"},...}} instead.`

const PLAN_SYSTEM = `You are Uttar AI, a strength and conditioning coach inside the Uttar Fitness app.
Build a weekly training plan. Return ONLY a JSON object, with no markdown fences and no prose, in this shape:
{"type":"plan","plan":{"Monday":{"type":"workout","workout_title":"Upper body","workout_duration":45,"workout_difficulty":"intermediate","exercises":[{"name":"Exercise","sets":3,"reps":"10","duration_seconds":null,"rest_seconds":60,"notes":"short cue"}]},"Tuesday":{"type":"rest","label":"Rest"},...}}
Rules:
- Include all seven days, Monday through Sunday, in order.
- Choose 2-5 training days based on the goal, experience, and schedule; the rest are rest days.
- 4-8 exercises per training day. Keep sessions within the requested time.
- Use realistic weekly spacing and avoid training the same muscle group hard on back-to-back days.
- duration_seconds is a number for holds/timed cardio, otherwise null. reps is a string such as "10" or "8-12".
- If they only asked for a single workout, return {"name":"...","estimated_duration":30,"estimated_calories":250,"difficulty":"...","exercises":[...]} instead.`

function buildContext(userData) {
  if (!userData) return ''
  const parts = []
  const first = String(userData.full_name || '').trim().split(/\s+/)[0]
  if (first) parts.push(`Name: ${first}`)
  if (userData.fitness_goal) parts.push(`Fitness goal: ${userData.fitness_goal}`)
  const goal = userData.goal && userData.goal !== userData.fitness_goal ? userData.goal : ''
  if (goal) parts.push(`Main goal: ${goal}`)
  if (userData.experience_level) parts.push(`Experience: ${userData.experience_level}`)
  if (Array.isArray(userData.preferred_types) && userData.preferred_types.length) {
    parts.push(`Preferred training: ${userData.preferred_types.join(', ')}`)
  }
  return parts.join('\n')
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-sm font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 text-sm font-semibold">{children}</h3>,
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-secondary/70 p-3 text-[12px]">{children}</pre>,
  code: ({ children, className }) => (
    <code className={className || 'rounded bg-secondary/70 px-1 py-0.5 text-[12px]'}>{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{children}</a>
  ),
}

function MessageText({ message }) {
  return (
    <div className="text-sm">
      <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
      {message.warning && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-[11px] text-amber-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message.warning}</span>
        </div>
      )}
    </div>
  )
}

/** Destination buttons for "where is…" replies. Paths are already allowlisted. */
function NavActions({ actions, onGo }) {
  if (!actions?.length) return null
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.path}
          type="button"
          onClick={() => onGo(action.path)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          {action.label}
        </button>
      ))}
    </div>
  )
}

function WorkoutCard({ message, saving, onSave, onStart }) {
  const workout = message.payload
  return (
    <GlassCard className="overflow-hidden border-primary/25 p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{workout.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" />{workout.exercises.length} exercises</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{workout.estimated_duration} min</span>
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />~{workout.estimated_calories} cal</span>
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">{workout.difficulty}</Badge>
      </div>

      <ol className="max-h-72 divide-y divide-border/30 overflow-y-auto">
        {workout.exercises.map((ex, i) => (
          <li key={`${ex.name}-${i}`} className="flex gap-3 px-4 py-2.5 text-sm">
            <span className="mt-0.5 w-4 shrink-0 text-xs font-semibold text-primary">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{ex.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {ex.sets} × {ex.reps}
                {ex.duration_seconds ? ` · ${ex.duration_seconds}s` : ''}
                {` · rest ${ex.rest_seconds}s`}
              </p>
              {ex.notes && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{ex.notes}</p>}
            </div>
          </li>
        ))}
      </ol>

      <div className="border-t border-border/40 p-3">
        {message.savedId ? (
          <Button className="w-full gap-2 rounded-xl" onClick={() => onStart(message.savedId)}>
            <Play className="h-4 w-4 fill-current" /> Start workout
          </Button>
        ) : (
          <Button className="w-full gap-2 rounded-xl" onClick={() => onSave(message)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save workout'}
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

function PlanCard({ message, saving, onApply, onOpen }) {
  const days = message.payload || []
  const trainingDays = days.filter((d) => !d.isRest).length
  return (
    <GlassCard className="overflow-hidden border-primary/25 p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 p-4">
        <div>
          <h3 className="font-bold">Your weekly plan</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{trainingDays} training days · {7 - trainingDays} rest days</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px]">AI plan</Badge>
      </div>

      <div className="divide-y divide-border/30">
        {days.map((day) => (
          <div key={day.dayKey} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{day.dayLabel.slice(0, 3)}</span>
            <span className={`min-w-0 flex-1 truncate ${day.isRest ? 'text-muted-foreground' : 'font-medium'}`}>{day.title}</span>
            {day.isRest
              ? <span className="text-[10px] text-muted-foreground">Rest</span>
              : <span className="shrink-0 text-[11px] text-muted-foreground">{day.minutes} min</span>}
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 p-3">
        {message.planApplied ? (
          <Button className="w-full gap-2 rounded-xl" onClick={onOpen}>
            <CalendarDays className="h-4 w-4" /> Open my Plan
          </Button>
        ) : (
          <Button className="w-full gap-2 rounded-xl" onClick={() => onApply(message)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'Applying…' : 'Apply to my Plan'}
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

function loadStoredMessages(storageKey) {
  if (!storageKey) return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Corrupt history should never block the coach.
  }
  return []
}

export default function UttarAI({ onClose }) {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isSheet = typeof onClose === 'function'

  const storageKey = user ? `xfit_uttar_ai_v1_${user.uid}` : null
  const [messages, setMessages] = useState(() => loadStoredMessages(storageKey))
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('chat')
  const [busy, setBusy] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const context = useMemo(() => buildContext(userData), [userData])
  const currentScreen = useMemo(
    () => describeLocation(location.pathname, location.search),
    [location.pathname, location.search]
  )

  // Persist the conversation as it changes. The initial value was read
  // synchronously above, so there is no empty-render clobber to guard against.
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)))
    } catch {
      // Storage can be full or disabled; the chat still works for this session.
    }
  }, [messages, storageKey])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  function systemFor(selectedMode) {
    const base = selectedMode === 'chat' ? CHAT_SYSTEM : selectedMode === 'plan' ? PLAN_SYSTEM : WORKOUT_SYSTEM
    const parts = []
    // Only chat needs to know where the person is; builders should just build.
    if (selectedMode === 'chat') parts.push(`The person is currently on: ${currentScreen}.`)
    if (context) parts.push(`About this person:\n${context}`)
    return parts.length ? `${base}\n\n${parts.join('\n\n')}` : base
  }

  function historyFrom(list) {
    return list
      .filter((m) => !m.error && m.content)
      .slice(-12)
      .map((m) => {
        let extra = ''
        if (m.kind === 'workout' && m.payload) {
          const w = m.payload
          extra = `Workout: ${w.name} (${w.estimated_duration} min, ${w.difficulty}). Exercises: ` +
            w.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join('; ')
        } else if (m.kind === 'plan' && m.payload) {
          extra = 'Weekly plan: ' + m.payload.map((d) => (
            `${d.dayLabel}: ${d.isRest ? 'Rest' : `${d.title} (${d.minutes} min; ${d.exercises.map((e) => e.name).join(', ')})`}`
          )).join('; ')
        }
        if (m.navActions?.length) {
          extra += `${extra ? ' ' : ''}Suggested destinations: ${m.navActions.map((a) => a.path).join(', ')}`
        }
        return { role: m.role, content: `${m.content}${extra ? `\n${extra}` : ''}`.slice(0, 4000) }
      })
  }

  async function send(text, forcedMode) {
    const content = String(text ?? input).trim()
    if (!content || busy || !user) return
    const selectedMode = forcedMode || mode
    const userMessage = { id: newId(), role: 'user', kind: 'text', content, mode: selectedMode }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setMode(selectedMode)
    setBusy(true)

    try {
      if (selectedMode === 'chat') {
        const reply = await callAI({
          system: systemFor('chat'),
          messages: historyFrom(nextMessages),
          maxTokens: 1200,
          allowMock: false,
        })
        // The model can end its reply with a <nav> block. Strip it before it is
        // rendered and turn it into validated destination buttons. If the model
        // forgets the block, the local keyword matcher still offers a way there.
        const { text: prose, actions } = extractNavActions(reply)
        const navActions = actions.length ? actions : findNavSuggestions(content)
        const fallback = navActions.length ? 'Here is where to find that.' : reply
        setMessages((prev) => [...prev, {
          id: newId(),
          role: 'assistant',
          kind: 'text',
          content: prose || fallback,
          navActions,
        }])
      } else {
        const reply = await callAI({
          system: systemFor(selectedMode),
          messages: historyFrom(nextMessages),
          maxTokens: 2000,
          allowMock: false,
        })
        const parsed = parseAIResponse(reply)

        if (!parsed) {
          setMessages((prev) => [...prev, {
            id: newId(),
            role: 'assistant',
            kind: 'text',
            content: reply,
            warning: 'I could not turn that into a workout card. Add a time, equipment, and experience level and try again.',
          }])
        } else if (parsed.kind === 'plan') {
          setMessages((prev) => [...prev, {
            id: newId(),
            role: 'assistant',
            kind: 'plan',
            content: 'Here is a week that fits your request. Apply it when you are ready.',
            payload: parsed.days,
            prompt: content,
          }])
        } else {
          setMessages((prev) => [...prev, {
            id: newId(),
            role: 'assistant',
            kind: 'workout',
            content: 'Here is a workout you can save and start.',
            payload: parsed.workout,
            prompt: content,
          }])
        }
      }
    } catch (err) {
      console.error('Uttar AI request failed', err)
      const friendly = /failed to fetch|network/i.test(err?.message || '')
        ? 'I could not reach the AI coach. Check your connection and try again.'
        : err?.message || 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, {
        id: newId(),
        role: 'assistant',
        kind: 'text',
        content: friendly,
        error: true,
      }])
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveWorkout(message) {
    setSavingId(message.id)
    try {
      const id = await saveAIWorkout(user.uid, message.payload, message.prompt || '')
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, savedId: id } : m)))
      queryClient.invalidateQueries({ queryKey: ['custom-workouts', user.uid] })
      toast.success('Workout saved to your library')
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not save that workout')
    } finally {
      setSavingId(null)
    }
  }

  async function handleApplyPlan(message) {
    setSavingId(message.id)
    try {
      await saveAIWeeklyPlan(user.uid, message.payload, message.prompt || '')
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, planApplied: true } : m)))
      queryClient.invalidateQueries({ queryKey: ['schedule', user.uid] })
      queryClient.invalidateQueries({ queryKey: ['custom-workouts', user.uid] })
      toast.success('Weekly plan applied to your Plan page')
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not apply that plan')
    } finally {
      setSavingId(null)
    }
  }

  function clearChat() {
    if (messages.length && !window.confirm('Clear this conversation?')) return
    setMessages([])
    if (storageKey) {
      try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
    }
  }

  function chooseSuggestion(suggestion) {
    setMode(suggestion.mode)
    send(suggestion.text, suggestion.mode)
  }

  // Close the sheet first so the destination is visible immediately.
  function goTo(path) {
    if (typeof onClose === 'function') onClose()
    navigate(path)
  }

  const placeholder = mode === 'chat'
    ? 'Ask about training, nutrition, recovery, or form…'
    : mode === 'plan'
      ? 'Describe your goal, days per week, time, and equipment…'
      : 'Describe the workout: time, focus, equipment, experience…'

  const sendLabel = mode === 'chat' ? 'Send' : mode === 'plan' ? 'Build plan' : 'Build workout'

  return (
    <div className={isSheet
      ? 'flex min-h-0 flex-1 flex-col'
      : 'mx-auto flex h-[calc(100dvh-6rem)] max-w-2xl flex-col md:h-dvh'}>
      <header className={`flex shrink-0 items-start justify-between gap-3 px-4 pb-3 ${isSheet ? 'pt-4' : 'pt-6'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 rounded-2xl shadow-lg shadow-black/20" emblemClassName="w-7" />
          <div className="min-w-0">
            <h1 id="uttar-ai-title" className="text-xl font-black">Uttar AI</h1>
            <p className="truncate text-xs text-muted-foreground">Your coach for training, nutrition, and recovery</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" onClick={clearChat} aria-label="New chat">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {isSheet && (
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" onClick={onClose} aria-label="Close Uttar AI">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
              <p className="text-sm leading-relaxed">
                Hey{userData?.full_name ? ` ${String(userData.full_name).split(/\s+/)[0]}` : ''} — I can answer health and nutrition
                questions, build a single workout, or set up your whole week. What are we working on?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={suggestion.title}
                    onClick={() => chooseSuggestion(suggestion)}
                    disabled={busy}
                    className="group rounded-2xl border border-border/50 bg-card/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" /> {suggestion.title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-foreground/70">{suggestion.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                  {message.content}
                </div>
              ) : (
                <div className="w-full max-w-[92%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                    <Sparkles className="h-3 w-3 text-primary" /> Uttar AI
                  </div>
                  {message.kind === 'workout' ? (
                    <WorkoutCard
                      message={message}
                      saving={savingId === message.id}
                      onSave={handleSaveWorkout}
                      onStart={(id) => navigate(`/player/custom/${id}`)}
                    />
                  ) : message.kind === 'plan' ? (
                    <PlanCard
                      message={message}
                      saving={savingId === message.id}
                      onApply={handleApplyPlan}
                      onOpen={() => navigate('/plan')}
                    />
                  ) : (
                    <div className={`rounded-2xl rounded-bl-md border px-3.5 py-2.5 ${message.error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-border/50 bg-card/75'}`}>
                      <MessageText message={message} />
                      <NavActions actions={message.navActions} onGo={goTo} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-border/50 bg-card/75 px-3.5 py-3 text-xs text-muted-foreground">
              <BrandLoader size="xs" />
              {mode === 'chat' ? 'Thinking…' : mode === 'plan' ? 'Building your week…' : 'Building your workout…'}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background/85 px-4 pt-3 pb-3 backdrop-blur-md"
        style={isSheet ? { paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' } : undefined}>
        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id); inputRef.current?.focus() }}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                mode === id ? 'bg-background text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${mode === id ? 'text-primary' : 'text-foreground/60'}`} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={placeholder}
            className="min-h-[52px] max-h-32 flex-1 resize-none border-white/10 bg-transparent text-sm"
            rows={1}
          />
          <Button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="h-[52px] shrink-0 gap-1.5 rounded-xl px-3.5"
            aria-label={sendLabel}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'chat' ? <Send className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            <span className="text-xs">{sendLabel}</span>
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-foreground/70">
          AI can make mistakes — check form and safety, and talk to a clinician about injuries or medical conditions.
        </p>
      </div>
    </div>
  )
}
