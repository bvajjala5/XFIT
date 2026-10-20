import React, { useState, useEffect } from 'react'
import { localDateStr } from '@/lib/utils'
import { Droplets, Plus, Minus } from 'lucide-react'

export default function WaterTracker() {
  const [glasses, setGlasses] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const saved = localStorage.getItem('xfit_water_goal')
      if (saved) return Number(saved)
    } catch {}
    return 8
  })

  useEffect(() => {
    const today = localDateStr()
    const stored = localStorage.getItem('xfit_water_' + today)
    if (stored) setGlasses(Number(stored))
    const onStorage = () => {
      const nextGoal = Number(localStorage.getItem('xfit_water_goal'))
      if (nextGoal > 0) setDailyGoal(nextGoal)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = value => {
    const next = Math.max(0, Math.min(12, value))
    setGlasses(next)
    localStorage.setItem('xfit_water_' + localDateStr(), String(next))
  }
  const progress = Math.min((glasses / dailyGoal) * 100, 100)

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="water-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Droplets className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <h2 id="water-title" className="text-sm font-medium">Water</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Goal: {dailyGoal} glasses</p>
          </div>
        </div>
        <p className="text-sm font-semibold tabular-nums">{glasses}<span className="text-muted-foreground font-normal"> / {dailyGoal}</span></p>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-secondary" role="progressbar" aria-valuenow={glasses} aria-valuemin={0} aria-valuemax={dailyGoal} aria-label="Water goal progress">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={() => update(glasses - 1)} disabled={glasses === 0} aria-label="Remove one glass of water"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40">
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">{glasses >= dailyGoal ? 'Daily goal reached' : 'Log water'}</span>
        <button type="button" onClick={() => update(glasses + 1)} disabled={glasses >= 12} aria-label="Add one glass of water"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
