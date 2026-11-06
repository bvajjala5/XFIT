import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, X, CheckCircle2, Frown, Annoyed, Meh, Smile, Laugh, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, Zap } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { localDateStr } from '@/lib/utils'
import useFocusTrap from '@/hooks/useFocusTrap'

const SLEEP_FEEL = [[Frown, 'Awful'], [Annoyed, 'Poor'], [Meh, 'Okay'], [Smile, 'Good'], [Laugh, 'Great']]
const ENERGY = [[BatteryWarning, 'Drained'], [BatteryLow, 'Low'], [BatteryMedium, 'Okay'], [BatteryFull, 'Good'], [Zap, 'Charged']]
const SORE = [['None', 1], ['Light', 2], ['Some', 3], ['Sore', 4], ['Very', 5]]
const FOOD = [['Yes', 'yes'], ['Partly', 'partly'], ['No', 'no']]

// 0–100, only from the answers the user actually gave. Higher = ready for a harder session.
export function checkinReadiness({ sleepHours, sleepFeel, energy, soreness, jointPain }) {
  const parts = []
  if (sleepHours != null) parts.push(Math.min(sleepHours / 8, 1) * 100)
  if (sleepFeel) parts.push(((sleepFeel - 1) / 4) * 100)
  if (energy) parts.push(((energy - 1) / 4) * 100)
  if (soreness) parts.push(((5 - soreness) / 4) * 100)
  if (!parts.length) return null
  let score = parts.reduce((a, b) => a + b, 0) / parts.length
  if (jointPain) score -= 15
  return Math.round(Math.max(0, Math.min(100, score)))
}

function advice(score, jointPain) {
  if (score == null) return { title: 'Checked in', body: 'Have a great day.' }
  if (jointPain) return { title: 'Go easy on the joints', body: 'Pick mobility or light work today, and skip anything that hurts.' }
  if (score >= 75) return { title: 'Ready to push', body: 'You’re well recovered. A good day for a hard session.' }
  if (score >= 50) return { title: 'Good to train', body: 'Solid base. Train as planned and listen to your body.' }
  return { title: 'Take it easier', body: 'Recovery is low. Keep it light or do mobility today.' }
}

const waterKey = () => 'xfit_water_' + localDateStr()
const readWater = () => { try { return Number(localStorage.getItem(waterKey())) || 0 } catch (e) { return 0 } }
const waterGoal = () => { try { return Number(localStorage.getItem('xfit_water_goal')) || 8 } catch (e) { return 8 } }

function Row({ title, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Choice({ active, onClick, children, className = '' }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 min-h-[44px] rounded-xl text-sm transition-all active:scale-95 ${active ? 'bg-primary/20 ring-2 ring-primary text-foreground font-semibold' : 'bg-secondary/60 text-muted-foreground'} ${className}`}>
      {children}
    </button>
  )
}

export default function DailyCheckIn({ userId, open, onDismiss, onComplete }) {
  const [sleepHours, setSleepHours] = useState(7.5)
  const [sleepTouched, setSleepTouched] = useState(false)
  const [sleepFeel, setSleepFeel] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [food, setFood] = useState(null)
  const [soreness, setSoreness] = useState(null)
  const [jointPain, setJointPain] = useState(false)
  const [water, setWater] = useState(readWater)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const contentRef = useRef(null)
  const goal = waterGoal()

  useEffect(() => { if (open) { setWater(readWater()); setResult(null) } }, [open])
  useFocusTrap(contentRef, open, onDismiss)

  const setGlasses = (n) => {
    const next = Math.max(0, Math.min(12, n))
    setWater(next)
    try { localStorage.setItem(waterKey(), String(next)) } catch (e) {}   // same place the water tracker uses
  }

  const answered = sleepTouched || sleepFeel || energy || food || soreness || jointPain || water > 0

  const save = async () => {
    if (saving) return
    setSaving(true)
    const today = localDateStr()
    const data = {
      sleepHours: sleepTouched ? sleepHours : null,
      sleepFeel, energy, nutritionOnTrack: food, soreness, jointPain,
      hydrationGlasses: water, date: today, createdAt: new Date(),
    }
    const score = checkinReadiness({ sleepHours: data.sleepHours, sleepFeel, energy, soreness, jointPain })
    data.readiness = score
    try {
      if (userId) await setDoc(doc(db, 'users', userId, 'checkins', today), data)
    } catch (e) { console.error('Check-in save error:', e) }
    try { localStorage.setItem('xfit_checkin_date', today) } catch (e) {}
    setResult(advice(score, jointPain))
    setSaving(false)
    onComplete?.(data)
  }

  // Portal to <body>: the page content sits in its own stacking layer, below the bottom nav.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => onDismiss?.()}>
          <motion.div
            ref={contentRef}
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="daily-checkin-title"
            tabIndex={-1}
            className="w-full sm:max-w-md bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto focus:outline-none"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="daily-checkin-title" className="text-xl font-extrabold tracking-tight">Check-in</h2>
                <p className="text-xs text-muted-foreground">Takes 20 seconds. Skip anything you like.</p>
              </div>
              <button onClick={() => onDismiss?.()} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {result ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="text-xl font-extrabold">{result.title}</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{result.body}</p>
                <button onClick={() => onDismiss?.()} className="mt-5 w-full min-h-[48px] rounded-2xl primary-gradient text-white font-semibold">Done</button>
              </motion.div>
            ) : (
              <div className="space-y-5">
                <Row title="Sleep" hint={sleepTouched ? `${sleepHours} h` : 'Slide to set hours'}>
                  <input type="range" min="3" max="12" step="0.5" value={sleepHours} aria-label="Hours slept"
                    onChange={(e) => { setSleepHours(Number(e.target.value)); setSleepTouched(true) }}
                    className="w-full accent-[hsl(var(--primary))] h-8" />
                  <div className="flex gap-1.5">
                    {SLEEP_FEEL.map(([Icon, l], i) => (
                      <Choice key={l} active={sleepFeel === i + 1} onClick={() => setSleepFeel(i + 1)}>
                        <Icon className="w-5 h-5 mx-auto" strokeWidth={1.75} />
                        <span className="block text-[10px] mt-1">{l}</span>
                      </Choice>
                    ))}
                  </div>
                </Row>

                <Row title="Energy right now">
                  <div className="flex gap-1.5">
                    {ENERGY.map(([Icon, l], i) => (
                      <Choice key={l} active={energy === i + 1} onClick={() => setEnergy(i + 1)}>
                        <Icon className="w-5 h-5 mx-auto" strokeWidth={1.75} />
                        <span className="block text-[10px] mt-1">{l}</span>
                      </Choice>
                    ))}
                  </div>
                </Row>

                <Row title="Hit your nutrition goals yesterday?">
                  <div className="flex gap-1.5">
                    {FOOD.map(([l, v]) => <Choice key={v} active={food === v} onClick={() => setFood(v)}>{l}</Choice>)}
                  </div>
                </Row>

                <Row title="Soreness" hint="Muscles and joints">
                  <div className="flex gap-1.5">
                    {SORE.map(([l, v]) => <Choice key={v} active={soreness === v} onClick={() => setSoreness(v)} className="text-xs">{l}</Choice>)}
                  </div>
                  <button type="button" onClick={() => setJointPain(!jointPain)} aria-pressed={jointPain}
                    className={`w-full min-h-[44px] rounded-xl text-sm transition-all ${jointPain ? 'bg-red-500/15 ring-2 ring-red-400/60 text-foreground font-semibold' : 'bg-secondary/60 text-muted-foreground'}`}>
                    {jointPain ? 'Joint pain: yes' : 'Any joint pain?'}
                  </button>
                </Row>

                <Row title="Hydration" hint={`${water} / ${goal} glasses`}>
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: Math.max(goal, water) }, (_, i) => (
                      <button key={i} type="button" onClick={() => setGlasses(i < water ? i : i + 1)} aria-label={`${i + 1} glasses`}
                        className="w-10 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                        <Droplets className={`w-6 h-6 ${i < water ? 'text-blue-400 fill-blue-400/30' : 'text-muted-foreground/40'}`} />
                      </button>
                    ))}
                  </div>
                </Row>

                <button onClick={save} disabled={saving || !answered}
                  className="w-full min-h-[48px] rounded-2xl primary-gradient text-white font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
                  {saving ? 'Saving…' : 'Save check-in'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
