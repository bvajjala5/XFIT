import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sparkles, Play, Pencil, ChevronRight, ChevronLeft, Trash2, Plus, Clock, Flame, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { callAI } from '@/lib/ai'

const EXERCISE_TYPES = ['curl', 'push_up', 'squat', 'lateral_raise', 'plank', 'lunge', 'russian_twist', 'hip_raise', 'overhead_press', 'jump']

const EXAMPLE_PROMPTS = [
  '20 minute full body HIIT — no equipment, beginner friendly',
  'Quick 10 min morning stretch and core activation',
  'Heavy upper body day: chest, shoulders, triceps — 45 mins',
  'Leg day: squats, lunges, hip raises — 30 mins intermediate',
  "Bhanu's Locked In style — intense 20 min strength circuit",
  '5 min abs finisher after any workout',
]

function guessAnimation(name) {
  const n = name.toLowerCase()
  if (n.includes('curl') || n.includes('bicep')) return 'curl'
  if (n.includes('push') || n.includes('press') && n.includes('chest')) return 'push_up'
  if (n.includes('squat')) return 'squat'
  if (n.includes('lateral') || n.includes('raise') && n.includes('side')) return 'lateral_raise'
  if (n.includes('plank') || n.includes('hold')) return 'plank'
  if (n.includes('lunge') || n.includes('split')) return 'lunge'
  if (n.includes('twist') || n.includes('russian')) return 'russian_twist'
  if (n.includes('hip') || n.includes('glute') || n.includes('bridge')) return 'hip_raise'
  if (n.includes('press') || n.includes('shoulder') || n.includes('overhead')) return 'overhead_press'
  if (n.includes('jump') || n.includes('hop') || n.includes('jack')) return 'jump'
  return 'squat'
}

export default function CustomWorkoutBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1) // 1 = describe, 2 = preview/edit
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState([])
  const [saving, setSaving] = useState(false)

  async function generateWorkout() {
    if (!prompt.trim()) { toast.error('Describe your workout first'); return }
    setLoading(true)
    try {
      const systemPrompt = `You are a personal trainer AI that creates structured workouts. 
Given a workout description, respond ONLY with valid JSON (no markdown fences, no extra text) in this exact shape:
{
  "name": "Workout Name",
  "estimated_duration": 20,
  "estimated_calories": 250,
  "difficulty": "beginner|intermediate|advanced",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": "12",
      "duration_seconds": 45,
      "rest_seconds": 30,
      "notes": "optional tip"
    }
  ]
}
Rules:
- duration_seconds: how long to perform the exercise (or null if pure reps)
- reps: can be a number string like "12" or a range like "8-12" or "To failure"
- Include 5-15 exercises appropriate to the description
- Be realistic with timing and difficulty`
      const text = await callAI({ system: systemPrompt, messages: [{ role: 'user', content: prompt }], maxTokens: 1500 })
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setWorkoutName(parsed.name || 'My Workout')
      setExercises(
        (parsed.exercises || []).map((ex, i) => ({
          ...ex,
          id: `ex-${i}-${Date.now()}`,
          animation: guessAnimation(ex.name),
        }))
      )
      setStep(2)
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate workout. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  function updateExercise(id, field, value) {
    setExercises((prev) => prev.map((ex) => ex.id === id ? { ...ex, [field]: value } : ex))
  }

  function removeExercise(id) {
    setExercises((prev) => prev.filter((ex) => ex.id !== id))
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { id: `ex-new-${Date.now()}`, name: 'New Exercise', sets: 3, reps: '10', duration_seconds: null, rest_seconds: 30, animation: 'squat', notes: '' },
    ])
  }

  async function saveAndStart(startNow = false) {
    if (!workoutName.trim() || exercises.length === 0) { toast.error('Add at least one exercise'); return }
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'customWorkouts'), {
        name: workoutName,
        exercises,
        prompt,
        created_at: serverTimestamp(),
        estimated_duration: Math.round(
          exercises.reduce((s, ex) => s + (ex.duration_seconds || 40) * (ex.sets || 1) + (ex.rest_seconds || 30) * (ex.sets || 1), 0) / 60
        ),
      })
      queryClient.invalidateQueries(['custom-workouts', user.uid])
      toast.success('Workout saved!')
      if (startNow) navigate(`/player/custom/${docRef.id}`)
      else navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save workout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        {step === 2 && (
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setStep(1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="w-6 h-6 text-primary" />
            {step === 1 ? 'Build Workout' : 'Preview & Edit'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? 'Describe your workout — AI structures it for you' : 'Tweak exercises before starting'}
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
            {/* Prompt input */}
            <GlassCard className="space-y-3">
              <label className="text-sm font-semibold">Describe your workout</label>
              <Textarea
                placeholder="e.g. 20 minute full body HIIT, no equipment, beginner friendly..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-transparent border-white/10 resize-none min-h-[120px] text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) generateWorkout() }}
              />
              <Button onClick={generateWorkout} disabled={loading || !prompt.trim()} className="w-full rounded-xl gap-2 h-11">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
              </Button>
            </GlassCard>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Try an example</p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-left glass rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 border border-transparent transition-all"
                  >
                    <span className="text-primary mr-2">→</span>{ex}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Workout name */}
            <GlassCard className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Workout Name</label>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="bg-transparent border-white/10 font-bold text-lg h-12"
              />
            </GlassCard>

            {/* Exercise list */}
            <div className="space-y-2">
              {exercises.map((ex, idx) => (
                <motion.div key={ex.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={ex.name}
                          onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                          className="bg-transparent border-white/10 font-semibold"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Sets</label>
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(ex.id, 'sets', Number(e.target.value))}
                              className="bg-transparent border-white/10 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Reps</label>
                            <Input
                              value={ex.reps}
                              onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                              className="bg-transparent border-white/10 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Rest (s)</label>
                            <Input
                              type="number"
                              value={ex.rest_seconds}
                              onChange={(e) => updateExercise(ex.id, 'rest_seconds', Number(e.target.value))}
                              className="bg-transparent border-white/10 h-8 text-sm"
                            />
                          </div>
                        </div>
                        {ex.notes && <p className="text-[11px] text-muted-foreground">{ex.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg h-8 w-8 shrink-0"
                        onClick={() => removeExercise(ex.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              <button
                onClick={addExercise}
                className="w-full glass rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-white/10 hover:border-primary/30 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2" onClick={() => saveAndStart(false)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save for Later
              </Button>
              <Button className="flex-1 rounded-xl h-12 gap-2" onClick={() => saveAndStart(true)} disabled={saving}>
                <Play className="w-4 h-4 fill-current" />
                Start Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
