import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { localDateStr } from '@/lib/utils'
import { Quote } from 'lucide-react'

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "Success starts with self-discipline.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up determined. Go to bed satisfied.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "It never gets easier, you just get stronger.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Discipline is doing what needs to be done, even if you don't want to.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
  { text: "What seems impossible today will one day become your warm-up.", author: "Unknown" },
  { text: "Strength does not come from the physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The difference between try and triumph is just a little umph.", author: "Marvin Phillips" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "If it doesn't challenge you, it doesn't change you.", author: "Fred DeVito" },
  { text: "Today I will do what others won't, so tomorrow I can do what others can't.", author: "Jerry Rice" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Results happen over time, not overnight. Work hard, stay consistent, be patient.", author: "Unknown" },
  { text: "Blood. Sweat. Respect. First two you give. Last one you earn.", author: "Unknown" },
  { text: "Locked in. Every single day.", author: "Bhanu Vajjala" },
]

function getDailyQuote() {
  // Pick a quote based on the day of year so it changes daily but is consistent
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function DailyQuote() {
  const [quote] = useState(getDailyQuote)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    const today = localDateStr()
    const storedLike = localStorage.getItem('xfit_quote_liked_' + today)
    setLiked(storedLike === 'true')
  }, [])

  const toggleLike = () => {
    const next = !liked
    setLiked(next)
    localStorage.setItem('xfit_quote_liked_' + localDateStr(), String(next))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card border border-border/60 rounded-3xl p-5 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl primary-gradient pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium leading-relaxed italic">"{quote.text}"</p>
          <p className="text-xs text-muted-foreground">— {quote.author}</p>
        </div>
        <button onClick={toggleLike}
          className="shrink-0 text-lg transition-transform active:scale-125"
          title={liked ? 'Unlike' : 'Save quote'}>
          {liked ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">Quote of the day</p>
        <p className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
      </div>
    </motion.div>
  )
}
