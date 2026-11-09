// Single source of truth for where things live in the Uttar Fitness app.
// Uttar AI uses it to answer "where is…" questions and the chat UI uses it to
// validate the destination buttons the model proposes.

export const APP_DESTINATIONS = [
  {
    path: '/',
    label: 'Go to Home',
    title: 'Home',
    description: 'Daily dashboard with today’s workout, weekly progress, the daily check-in, and quick links to Plan, Build, and Run.',
    keywords: ['home', 'dashboard', 'today', 'check-in', 'check in', 'daily check-in', 'daily check in'],
  },
  {
    path: '/health',
    label: 'Open Health Hub',
    title: 'Health Hub · Overview',
    description: 'Overview of weight, sleep, steps, heart rate, blood oxygen, and calories burned. Tap Log Stats to add today’s numbers.',
    keywords: ['health', 'health hub', 'overview', 'sleep', 'steps', 'heart rate', 'blood oxygen', 'spo2', 'log stats'],
  },
  {
    path: '/health?tab=weight',
    label: 'Log or view weight',
    title: 'Health Hub · Weight',
    description: 'Log body weight and see the weight trend over time.',
    keywords: ['weight', 'body weight', 'weigh in', 'scale', 'weight log'],
  },
  {
    path: '/health?tab=nutrition',
    label: 'Open food diary',
    title: 'Health Hub · Nutrition',
    description: 'Search foods, log meals, and track calories, protein, carbs, and fat.',
    keywords: ['nutrition', 'food', 'food diary', 'meal', 'meals', 'diet', 'calories', 'macros', 'protein', 'log food'],
  },
  {
    path: '/workouts',
    label: 'Browse workouts',
    title: 'Workouts',
    description: 'Search and filter the workout library, open your custom workouts, and jump to Plan, Build, or the Run tracker.',
    keywords: ['workouts', 'workout library', 'browse workouts', 'exercise library', 'custom workouts'],
  },
  {
    path: '/plan',
    label: 'Open weekly plan',
    title: 'Weekly plan',
    description: 'See and edit the weekly split, assign workouts to days, and start scheduled sessions.',
    keywords: ['plan', 'weekly plan', 'schedule', 'split', 'calendar', 'my week'],
  },
  {
    path: '/builder',
    label: 'Build a workout',
    title: 'Build',
    description: 'Create a custom workout manually or describe one and let AI build it.',
    keywords: ['builder', 'build', 'create workout', 'custom workout', 'make a workout', 'new workout'],
  },
  {
    path: '/run',
    label: 'Start the run tracker',
    title: 'Run tracker',
    description: 'Full-screen GPS run tracking with pace, distance, and splits.',
    keywords: ['run', 'running', 'gps', 'track a run', 'run tracker', 'start a run'],
  },
  {
    path: '/stats',
    label: 'View my stats',
    title: 'Stats',
    description: 'Workout totals, streaks, minutes and calories, activity charts, weekly volume, and recent workouts.',
    keywords: ['stats', 'statistics', 'progress', 'charts', 'trend', 'streak', 'volume'],
  },
  {
    path: '/profile#profile-settings',
    label: 'Go to Profile settings',
    title: 'Profile · Profile Settings',
    description: 'Change fitness goal, experience level, and distance units. Open Profile, then tap Edit on the Profile Settings card.',
    keywords: ['settings', 'profile settings', 'fitness goal', 'experience level', 'distance unit', 'units', 'edit profile'],
  },
  {
    path: '/profile#app-theme',
    label: 'Change app theme',
    title: 'Profile · App Theme',
    description: 'Switch between Midnight (dark), Sunrise (light), and Auto theme.',
    keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'midnight', 'sunrise', 'auto theme'],
  },
  {
    path: '/profile',
    label: 'Open profile',
    title: 'Profile',
    description: 'Account overview, profile settings, theme, workout history, personal records, legal links, sign out, and delete account.',
    keywords: ['profile', 'account', 'sign out', 'logout', 'log out', 'delete account', 'my account'],
  },
  {
    path: '/history',
    label: 'Open workout history',
    title: 'Workout History',
    description: 'Every completed workout with its date, duration, and details.',
    keywords: ['history', 'workout history', 'past workouts', 'completed workouts'],
  },
  {
    path: '/records',
    label: 'Open personal records',
    title: 'Personal Records',
    description: 'Track and add your best lifts and performance records.',
    keywords: ['records', 'personal records', 'personal best', 'best lifts', 'prs', 'pr'],
  },
  {
    path: '/community',
    label: 'Open community',
    title: 'Community',
    description: 'Browse workouts shared by other Uttar Fitness users.',
    keywords: ['community', 'shared workouts', 'share', 'social', 'feed'],
  },
  {
    path: '/privacy',
    label: 'Read privacy policy',
    title: 'Privacy Policy',
    description: 'How your data is stored and used.',
    keywords: ['privacy', 'privacy policy', 'data policy'],
  },
  {
    path: '/terms',
    label: 'Read terms',
    title: 'Terms of Service',
    description: 'The app’s terms and conditions.',
    keywords: ['terms', 'terms of service', 'legal'],
  },
]

export const APP_GUIDE = APP_DESTINATIONS
  .map(({ title, path, description }) => `- ${title} (${path}): ${description}`)
  .join('\n')

export const NAV_OUTPUT_RULES = `App navigation:
When the person asks where something is, how to do something inside the app, or to be taken somewhere, answer with the exact place and offer a button. End that reply with exactly one machine-readable block on its own final line:
<nav>{"actions":[{"label":"Go to Profile settings","path":"/profile#profile-settings"}]}</nav>
Rules for the block:
- Use only paths from the app directory above, character for character.
- One action is usually best; never more than two.
- The label is a short button label (2–5 words) such as "Open weekly plan" or "Change app theme".
- Do not mention the block, the JSON, or the word "nav" in your prose.
- Do not include it for ordinary training, nutrition, or recovery questions that do not need app navigation.
- If you are not sure where something lives, say so instead of guessing.`

const NAV_PATHS = new Set(APP_DESTINATIONS.map((destination) => destination.path))

const ALIASES = {
  '/settings': '/profile#profile-settings',
  '/profile/settings': '/profile#profile-settings',
  '/profile#settings': '/profile#profile-settings',
  '/account/settings': '/profile#profile-settings',
  '/theme': '/profile#app-theme',
  '/profile#theme': '/profile#app-theme',
  '/appearance': '/profile#app-theme',
  '/weight': '/health?tab=weight',
  '/nutrition': '/health?tab=nutrition',
  '/food': '/health?tab=nutrition',
  '/food-diary': '/health?tab=nutrition',
  '/plans': '/plan',
  '/custom': '/builder',
  '/custom-workout': '/builder',
  '/personal-records': '/records',
  '/prs': '/records',
}

function parseBlock(block) {
  const trimmed = String(block || '').trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/[[{][\s\S]*[\]}]/)
    if (!match) return null
    try { return JSON.parse(match[0]) } catch { return null }
  }
}

function toList(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (parsed && Array.isArray(parsed.actions)) return parsed.actions
  if (parsed && typeof parsed.path === 'string') return [parsed]
  return []
}

function normalizePath(raw) {
  let path = String(raw ?? '').trim()
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      path = `${url.pathname}${url.search}${url.hash}`
    } catch {
      return ''
    }
  }
  if (!path.startsWith('/')) path = `/${path}`
  if (path.length > 1) path = path.replace(/\/+$/, '') || '/'
  if (path === '/health?tab=overview') return '/health'
  return ALIASES[path] || path
}

function destinationFor(path) {
  return APP_DESTINATIONS.find((destination) => destination.path === path) || null
}

function cleanLabel(label, fallback) {
  const text = String(label ?? '').replace(/\s+/g, ' ').trim()
  return (text || fallback).slice(0, 48)
}

/** Turn one or more model-provided blocks into a short list of safe destinations. */
export function resolveNavActions(input) {
  const blocks = Array.isArray(input) ? input : [input]
  const actions = []
  const seen = new Set()

  for (const block of blocks) {
    const parsed = typeof block === 'string' ? parseBlock(block) : block
    for (const item of toList(parsed)) {
      const path = normalizePath(item?.path ?? item?.url ?? item?.href)
      const destination = destinationFor(path)
      if (!destination || seen.has(path)) continue
      seen.add(path)
      actions.push({
        path,
        label: cleanLabel(item?.label ?? item?.name, destination.label),
        title: destination.title,
      })
      if (actions.length >= 3) return actions
    }
  }

  return actions
}

/**
 * Pull the nav block out of a model reply before it is rendered. Returns the
 * prose without the block plus the validated destination buttons.
 */
export function extractNavActions(content) {
  if (typeof content !== 'string') return { text: content, actions: [] }
  const blocks = []
  let text = content

  text = text.replace(/<nav(?:\s[^>]*)?>([\s\S]*?)<\/nav>/gi, (_, body) => {
    blocks.push(body)
    return ''
  })
  text = text.replace(/```nav\s*([\s\S]*?)```/gi, (_, body) => {
    blocks.push(body)
    return ''
  })
  // Remove fences left behind when the <nav> block lived inside a code block.
  text = text.replace(/```(?:html|json|nav)?\s*```/gi, '')

  return {
    text: text.replace(/\n{3,}/g, '\n\n').trim(),
    actions: resolveNavActions(blocks),
  }
}

const INTENT = /\b(where(?:'s| is| are)?|how (?:do|can|would|should) i|how to|take me|bring me|go to|open|navigate|find|locate|change|switch|edit|update|set up|turn on|turn off|show me|i want to|i need to|can you take me)\b/i

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Local safety net: if the model answers with words but forgets the nav block,
 * attach the most relevant destination for clear "where/how/open" questions.
 */
export function findNavSuggestions(query) {
  const text = String(query ?? '').toLowerCase().trim()
  if (!text || !INTENT.test(text)) return []

  const scored = []
  for (const destination of APP_DESTINATIONS) {
    let score = 0
    for (const keyword of destination.keywords) {
      if (keyword.includes(' ')) {
        if (text.includes(keyword)) score += 3
      } else if (new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text)) {
        score += 1
      }
    }
    if (score > 0) scored.push({ destination, score })
  }

  scored.sort((a, b) => b.score - a.score)
  const actions = []
  if (scored[0]) {
    const { destination } = scored[0]
    actions.push({ path: destination.path, label: destination.label, title: destination.title })
  }
  if (scored[1] && scored[1].score >= 3 && scored[1].destination.path !== scored[0]?.destination.path) {
    const { destination } = scored[1]
    actions.push({ path: destination.path, label: destination.label, title: destination.title })
  }
  return actions
}

/** Human-readable label for the screen the person is currently on. */
export function describeLocation(pathname, search = '') {
  const fullPath = `${pathname || '/'}${search || ''}`
  const exact = APP_DESTINATIONS.find((destination) => destination.path === fullPath)
  if (exact) return `${exact.title} (${fullPath})`
  if (pathname?.startsWith('/workouts/')) return `Workout details (${fullPath})`
  if (pathname?.startsWith('/player/')) return `Workout player (${fullPath})`
  if (pathname === '/run') return 'Run tracker (full screen)'
  if (pathname === '/builder') return 'Build (custom workout builder)'
  if (pathname === '/login') return 'Sign-in screen'
  return fullPath
}
