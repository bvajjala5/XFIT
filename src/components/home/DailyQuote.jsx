// Original, unattributed app copy. These are prompts, not quotations from
// real people — no invented or borrowed author credits.
const QUOTES = [
  'Show up, start small, and let the work add up.',
  'One focused set is better than a perfect plan you never start.',
  'Progress is built rep by rep, day by day.',
  'Your effort today sets up your strength tomorrow.',
  'Finish the set in front of you, then take the next step.',
  'A short session still counts when you show up.',
  'Consistency turns hard work into familiar work.',
  'Strong habits beat short bursts of motivation.',
  'The next rep is the only one you need to think about.',
  'Warm up, train with intent, and cool down.',
  'Train for the life you want outside the gym.',
  'Small improvements compound when you keep returning.',
  'Your pace is yours. Keep it steady and keep going.',
  'Rest when you need it, then get back to the work.',
  'Good form is a strength skill you can practice.',
  'Show yourself what you can do with a little patience.',
  'The best workout is the one you can repeat.',
  'Start where you are. Build from there.',
  'Every completed set is a vote for your future self.',
  'Focus on the next good choice, not a perfect result.',
  'Challenging work builds capacity when you recover well.',
  'Bring your attention to the movement and the breath.',
  'A little effort done often goes a long way.',
  'You do not need a perfect day to make progress.',
  'Direct your greatness, live Uttar.',
]

export function getDailyQuote() {
  // Pick a line based on the day of year so it changes daily but is consistent
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}
