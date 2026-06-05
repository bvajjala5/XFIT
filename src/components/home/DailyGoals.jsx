import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { localDateStr } from '@/lib/utils'
import { CheckCircle2, Circle, Pencil, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const PRESET_GOALS = [
  'Complete a workout 💪',
  'Drink 8 glasses of water 💧',
  'Get 8 hours of sleep 😴',
  'Eat a healthy meal 🥗',
  'Go for a walk outside 🚶',
  'Stretch for 10 minutes 🧘',
  'No junk food today 🚫',
  'Meditate for 5 minutes 🧠',
  'Read for 20 minutes 📚',
  'Take a cold shower 🚿',
]

const DEFAULT_GOALS = [
  'Complete a workout 💪',
  'Drink 8 glasses of water 💧',
  'Get 8 hours of sleep 😴',
]

export default function DailyGoals() {
  const [goals, setGoals] = useState([])
  const [completed, setCompleted] = useState({})
  const [editing, setEditing] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const today = localDateStr()

  useEffect(() => {
    const storedGoals = localStorage.getItem('xfit_goals')
    const storedCompleted = localStorage.getItem('xfit_goals_completed_' + today)
    setGoals(storedGoals ? JSON.parse(storedGoals) : DEFAULT_GOALS)
    setCompleted(storedCompleted ? JSON.parse(storedCompleted) : {})
  }, [])

  const saveGoals = (newGoals) => {
    setGoals(newGoals)
    localStorage.setItem('xfit_goals', JSON.stringify(newGoals))
  }

  const toggleComplete = (i) => {
    const next = { ...completed, [i]: !completed[i] }
    setCompleted(next)
    localStorage.setItem('xfit_goals_completed_' + today, JSON.stringify(next))
  }

  const addGoal = (text) => {
    if (!text.trim() || goals.length >= 6) return
    saveGoals([...goals, text.trim()])
    setNewGoal('')
  }

  const removeGoal = (i) => {
    saveGoals(goals.filter((_, idx) => idx !== i))
  }

  const addPreset = (preset) => {
    if (goals.includes(preset) || goals.length >= 6) return
    saveGoals([...goals, preset])
  }

  const completedCount = goals.filter((_, i) => completed[i]).length
  const allDone = completedCount === goals.length && goals.length > 0

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm flex items-center gap-2">
            🎯 Daily Goals
            {allDone && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">All done! 🎉</span>}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{completedCount}/{goals.length} completed today</p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${editing ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary rounded-full"
          animate={{ width: goals.length > 0 ? `${(completedCount / goals.length) * 100}%` : '0%' }}
          transition={{ duration: 0.5 }} />
      </div>

      {/* Goals list */}
      <div className="space-y-2">
        <AnimatePresence>
          {goals.map((goal, i) => (
            <motion.div key={goal} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3">
              <button onClick={() => !editing && toggleComplete(i)}
                className={`shrink-0 transition-all ${editing ? 'opacity-30 cursor-default' : 'active:scale-90'}`}>
                {completed[i]
                  ? <CheckCircle2 className="w-5 h-5 text-primary" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />
                }
              </button>
              <p className={`flex-1 text-sm transition-all ${completed[i] ? 'line-through text-muted-foreground' : ''}`}>
                {goal}
              </p>
              {editing && (
                <button onClick={() => removeGoal(i)}
                  className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit mode */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden">

            {/* Add custom goal */}
            {goals.length < 6 && (
              <div className="flex gap-2">
                <input
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal(newGoal)}
                  placeholder="Add a custom goal..."
                  className="flex-1 bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <button onClick={() => addGoal(newGoal)}
                  className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white active:scale-90">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Preset goals */}
            <button onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <span>Browse preset goals</span>
              {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showPresets && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden grid grid-cols-1 gap-1.5">
                  {PRESET_GOALS.filter(p => !goals.includes(p)).map(preset => (
                    <button key={preset} onClick={() => addPreset(preset)}
                      disabled={goals.length >= 6}
                      className="text-left text-xs px-3 py-2 rounded-xl bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-30 flex items-center gap-2">
                      <Plus className="w-3 h-3 shrink-0" /> {preset}
                    </button>
                  ))}
                  {goals.length >= 6 && <p className="text-xs text-muted-foreground text-center py-1">Max 6 goals reached</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
