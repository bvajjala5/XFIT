export function timeAgo(iso) {
  if (!iso) return '—'
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return '—'
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 45) return 'just now'
  const units = [
    ['minute', 60],
    ['hour', 60],
    ['day', 24],
    ['month', 30],
    ['year', 12],
  ]
  let value = seconds / 60
  let unit = 'minute'
  for (let i = 0; i < units.length - 1; i += 1) {
    unit = units[i][0]
    if (Math.abs(value) < units[i][1]) break
    value /= units[i][1]
  }
  const rounded = Math.round(value)
  if (unit === 'year') return `${rounded}y ago`
  if (unit === 'month') return `${rounded}mo ago`
  if (unit === 'day') return `${rounded}d ago`
  if (unit === 'hour') return `${rounded}h ago`
  return `${rounded}m ago`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function initials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

const GOAL_LABELS = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  improve_endurance: 'Improve Endurance',
  flexibility: 'Flexibility',
}

export function goalLabel(value) {
  if (!value) return 'Not set'
  return GOAL_LABELS[value] || value
}

export function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0)
  const minutes = Math.floor(total / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
