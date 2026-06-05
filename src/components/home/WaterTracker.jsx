import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { localDateStr } from '@/lib/utils'
import { Droplets, Plus, Minus } from 'lucide-react'

const DAILY_GOAL = 8 // glasses

export default function WaterTracker() {
  const [glasses, setGlasses] = useState(0)

  useEffect(() => {
    const today = localDateStr()
    const stored = localStorage.getItem('xfit_water_' + today)
    if (stored) setGlasses(Number(stored))
  }, [])

  const update = (val) => {
    const next = Math.max(0, Math.min(12, val))
    setGlasses(next)
    localStorage.setItem('xfit_water_' + localDateStr(), String(next))
  }

  const pct = Math.min((glasses / DAILY_GOAL) * 100, 100)
  const done = glasses >= DAILY_GOAL

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className={`w-5 h-5 ${done ? 'text-blue-400' : 'text-blue-300'}`} />
          <div>
            <p className="font-bold text-sm">Water Intake</p>
            <p className="text-[11px] text-muted-foreground">Daily goal: {DAILY_GOAL} glasses</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${done ? 'text-blue-400' : 'text-foreground'}`}>{glasses}</span>
          <span className="text-sm text-muted-foreground">/{DAILY_GOAL}</span>
          {done && <p className="text-[10px] text-blue-400 font-semibold">Goal met! 🎉</p>}
        </div>
      </div>

      {/* Glass icons */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {Array.from({ length: DAILY_GOAL }, (_, i) => (
          <motion.button
            key={i}
            onClick={() => update(i < glasses ? i : i + 1)}
            whileTap={{ scale: 0.85 }}
            className="relative"
          >
            <div className={`w-7 h-9 rounded-b-xl rounded-t-lg border-2 transition-all overflow-hidden ${i < glasses ? 'border-blue-400 bg-blue-400/20' : 'border-border bg-secondary/30'}`}>
              <AnimatePresence>
                {i < glasses && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    exit={{ height: 0 }}
                    className="absolute bottom-0 left-0 right-0 bg-blue-400/40 rounded-b-lg"
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 flex items-center justify-center h-full text-sm">
                {i < glasses ? '💧' : ''}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-blue-400 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => update(glasses - 1)}
          disabled={glasses === 0}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30 hover:bg-secondary/80 transition-colors active:scale-90">
          <Minus className="w-4 h-4" />
        </button>
        <p className="text-xs text-muted-foreground">Tap a glass to log</p>
        <button onClick={() => update(glasses + 1)}
          disabled={glasses >= 12}
          className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 hover:bg-primary/80 transition-colors active:scale-90">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
