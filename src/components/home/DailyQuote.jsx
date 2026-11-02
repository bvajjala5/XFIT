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

export function getDailyQuote() {
  // Pick a quote based on the day of year so it changes daily but is consistent
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}
