import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { localDateStr } from '@/lib/utils'

const MOODS = [
  { emoji: '🔥', label: 'Fired up' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😤', label: 'Stressed' },
]

const ENERGY_LEVELS = [
  { value: 1, label: 'Low', color: 'bg-red-400' },
  { value: 2, label: 'Meh', color: 'bg-orange-400' },
  { value: 3, label: 'Decent', color: 'bg-yellow-400' },
  { value: 4, label: 'Good', color: 'bg-green-400' },
  { value: 5, label: 'High', color: 'bg-emerald-400' },
]

export default function DailyCheckIn({ userId, onComplete, open, onDismiss }) {
  const controlled = open !== undefined
  const [visible, setVisible] = useState(controlled ? open : false)
  const [step, setStep] = useState(1) // 1=mood, 2=energy, 3=workout
  const [mood, setMood] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [workedOut, setWorkedOut] = useState(null)

  // Controlled mode: sync visibility with open prop
  useEffect(() => {
    if (controlled) setVisible(open)
  }, [open, controlled])

  // Uncontrolled mode: self-manage with localStorage check + delay
  useEffect(() => {
    if (controlled || !userId) return
    const today = localDateStr()
    const lastCheckin = localStorage.getItem('xfit_checkin_date')
    if (lastCheckin === today) return
    setTimeout(() => setVisible(true), 1500)
  }, [userId, controlled])

  const handleMood = (m) => {
    setMood(m)
    setTimeout(() => setStep(2), 300)
  }

  const handleEnergy = (e) => {
    setEnergy(e)
    setTimeout(() => setStep(3), 300)
  }

  const handleWorkout = async (did) => {
    setWorkedOut(did)
    const today = localDateStr()
    try {
      await setDoc(doc(db, 'users', userId, 'checkins', today), {
        mood: mood.label,
        moodEmoji: mood.emoji,
        energy: energy.value,
        energyLabel: energy.label,
        workedOut: did,
        date: today,
        createdAt: new Date(),
      })
      localStorage.setItem('xfit_checkin_date', today)
    } catch (e) { console.error('Checkin save error:', e) }
    setTimeout(() => {
      setVisible(false)
      onComplete?.({ mood, energy, workedOut: did })
      onDismiss?.()
    }, 800)
  }

  const dismiss = () => {
    localStorage.setItem('xfit_checkin_date', localDateStr())
    setVisible(false)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-5"
          >
            {/* Step 1 — Mood */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Daily Check-in</p>
                  <h2 className="text-xl font-black">How are you feeling?</h2>
                </div>
                <div className="flex justify-between gap-2">
                  {MOODS.map(m => (
                    <button key={m.label} onClick={() => handleMood(m)}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 hover:bg-secondary ${mood?.label === m.label ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/50'}`}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={dismiss} className="w-full text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
                  Skip for today
                </button>
              </div>
            )}

            {/* Step 2 — Energy */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Daily Check-in</p>
                  <h2 className="text-xl font-black">Energy level?</h2>
                  <p className="text-sm text-muted-foreground mt-1">How's your body feeling?</p>
                </div>
                <div className="flex gap-2">
                  {ENERGY_LEVELS.map(e => (
                    <button key={e.value} onClick={() => handleEnergy(e)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${energy?.value === e.value ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/50 hover:bg-secondary'}`}>
                      <div className={`w-3 h-8 rounded-full ${e.color} opacity-80`} />
                      <span className="text-[10px] font-medium text-muted-foreground">{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Workout */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Daily Check-in</p>
                  <h2 className="text-xl font-black">Did you work out today?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Or planning to?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Yes! 💪", value: true,  cls: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/40 text-green-300' },
                    { label: "Not yet", value: false, cls: 'bg-secondary/50 hover:bg-secondary border-border text-muted-foreground' },
                  ].map(opt => (
                    <button key={String(opt.value)} onClick={() => handleWorkout(opt.value)}
                      className={`py-4 rounded-2xl font-bold text-sm border transition-all active:scale-95 ${opt.cls}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Done state */}
            {workedOut !== null && step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
                <p className="text-3xl mb-2">🔒</p>
                <p className="font-black text-lg">Locked In.</p>
                <p className="text-sm text-muted-foreground">Let's make today count!</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
