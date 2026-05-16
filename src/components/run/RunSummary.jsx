import React from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { Trophy, Navigation, Footprints, Flame, Clock, TrendingUp, Share2, RotateCcw } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function RunSummary({ summary, userId, onClose }) {
  const { distance = 0, elapsed = 0, steps = 0, calories = 0, pace = 0, splits = [] } = summary || {}

  const distKm = (distance / 1000).toFixed(2)
  const paceStr = pace > 0
    ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')}`
    : '--:--'

  // Build split chart data
  const splitData = splits.map((sp, i) => ({
    km: `KM ${sp.km}`,
    time: i === 0 ? sp.time : sp.time - splits[i - 1].time,
  }))

  async function saveRun() {
    if (!userId) { toast.error('Not signed in'); return }
    try {
      const runData = {
        distance,
        elapsed,
        steps,
        calories,
        pace,
        splits: splits.map(s => ({ km: s.km, time: s.time })),
        completedAt: serverTimestamp(),
        type: 'run',
      }
      // Save to runs collection
      await addDoc(collection(db, 'users', userId, 'runs'), runData)
      // Also save to workouts collection so it shows in Recent Workouts + Progress + Streak
      await addDoc(collection(db, 'users', userId, 'workouts'), {
        workout_title: `Run — ${(distance / 1000).toFixed(2)} km`,
        workout_type: 'cardio',
        duration_seconds: elapsed,
        calories_burned: calories,
        completedAt: serverTimestamp(),
        type: 'run',
        distance,
        pace,
      })
      toast.success('Run saved!')
    } catch (err) {
      console.error('Save run error:', err)
      toast.error('Failed to save: ' + (err.message || 'Unknown error'))
    }
  }

  // Personal record detection (simplified — just celebrate if > 5km)
  const isPR = distance >= 5000

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      {/* Hero */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
        <div className="text-6xl mb-3">🏃</div>
        <h2 className="text-2xl font-black">Run Complete!</h2>
        {isPR && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full">
            <Trophy className="w-3 h-3" /> Personal Best!
          </div>
        )}
      </motion.div>

      {/* Primary stat */}
      <GlassCard className="text-center py-6">
        <div className="text-5xl font-black text-primary">{distKm}</div>
        <div className="text-muted-foreground mt-1">Kilometers</div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <div className="font-bold text-lg">{formatTime(elapsed)}</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400 shrink-0" />
          <div>
            <div className="font-bold text-lg">{paceStr}</div>
            <div className="text-xs text-muted-foreground">Avg Pace</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Footprints className="w-8 h-8 text-purple-400 shrink-0" />
          <div>
            <div className="font-bold text-lg">{steps.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Steps</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-400 shrink-0" />
          <div>
            <div className="font-bold text-lg">{calories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
        </GlassCard>
      </div>

      {/* Split chart */}
      {splitData.length > 0 && (
        <GlassCard className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Split Times</h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={splitData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="splitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="km" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="time" stroke="#60a5fa" fill="url(#splitGrad)" strokeWidth={2} name="Split (s)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2" onClick={onClose}>
          <RotateCcw className="w-4 h-4" /> Done
        </Button>
        <Button className="flex-1 rounded-xl h-12 gap-2" onClick={saveRun}>
          <Navigation className="w-4 h-4" /> Save Run
        </Button>
      </div>
    </div>
  )
}
