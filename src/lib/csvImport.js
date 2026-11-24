import { normalizeDistanceUnit, unitConfig } from './distanceUnits.js'

// Run imports stay entirely in the browser: the file is parsed on the device,
// previewed, and only written when the user confirms. Nothing is uploaded.
export const MAX_IMPORT_ROWS = 200

const HEADERS = {
  date: ['activity date', 'start time', 'started at', 'date', 'timestamp', 'completed at', 'completedat', 'completed_at'],
  distance: ['distance', 'distance mi', 'distance miles', 'distance km', 'distance kilometers', 'distance meters'],
  duration: ['duration', 'moving time', 'elapsed time', 'duration seconds', 'duration minutes', 'duration min', 'minutes'],
  calories: ['calories', 'calories burned', 'active calories', 'kcal'],
  steps: ['steps', 'step count', 'total steps'],
  title: ['activity name', 'title', 'name', 'workout'],
}

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[()_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Small RFC-4180-style parser: quoted fields, escaped quotes, CRLF and BOM. */
export function parseCsv(text) {
  if (typeof text !== 'string') return []
  const source = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function findColumn(headers, aliases) {
  const normalized = headers.map(normalizeHeader)
  return normalized.findIndex((header) => aliases.includes(header))
}

function distanceUnitFor(header, fallback) {
  const name = normalizeHeader(header)
  if (/\b(km|kilomet(?:er|re)s?)\b/.test(name)) return 'kilometers'
  if (/\b(mi|miles?)\b/.test(name)) return 'miles'
  if (/\b(m|meters?)\b/.test(name)) return 'meters'
  return fallback
}

function firstNumber(value) {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

export function parseDurationSeconds(value, header = '') {
  const text = String(value ?? '').trim()
  if (!text) return null

  const clock = text.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/)
  if (clock) {
    const [, a, b, c] = clock
    return c === undefined
      ? Number(a) * 60 + Number(b)
      : Number(a) * 3600 + Number(b) * 60 + Number(c)
  }

  const hours = text.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i)
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/i)
  const seconds = text.match(/(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?/i)
  if (hours || minutes || seconds) {
    return (Number(hours?.[1]) || 0) * 3600
      + (Number(minutes?.[1]) || 0) * 60
      + (Number(seconds?.[1]) || 0)
  }

  const number = Number(text)
  if (!Number.isFinite(number) || number <= 0) return null
  // A bare number in a column named "seconds" is seconds; everywhere else
  // workout exports conventionally use minutes.
  return /\bseconds?\b/i.test(String(header ?? '')) ? number : number * 60
}

function parseCompletedAt(value) {
  if (!value) return null
  const date = new Date(String(value).trim())
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function stableId(key) {
  let hash = 5381
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0
  return `csv-${(hash >>> 0).toString(36)}`
}

/**
 * Turn a CSV into the same run shape produced by the GPS tracker.
 * Returns `{ rows, errors, skipped }`; invalid rows are reported, not guessed.
 */
export function mapRunRows(text, { unit = 'miles' } = {}) {
  const table = parseCsv(text)
  const fallbackUnit = normalizeDistanceUnit(unit)
  if (table.length < 2) {
    return { rows: [], errors: ['The file has a header but no run rows.'], skipped: 0 }
  }

  const [header, ...data] = table
  const columns = {
    date: findColumn(header, HEADERS.date),
    distance: findColumn(header, HEADERS.distance),
    duration: findColumn(header, HEADERS.duration),
    calories: findColumn(header, HEADERS.calories),
    steps: findColumn(header, HEADERS.steps),
    title: findColumn(header, HEADERS.title),
  }

  if (columns.date < 0 || columns.distance < 0 || columns.duration < 0) {
    return {
      rows: [],
      errors: ['Missing a required column. Use date, distance, and duration headers.'],
      skipped: data.length,
    }
  }

  const rows = []
  const errors = []
  const seen = new Set()
  let skipped = 0

  for (let i = 0; i < data.length; i += 1) {
    const cells = data[i]
    const line = i + 2
    if (cells.every((cell) => !String(cell).trim())) continue

    const distanceValue = firstNumber(cells[columns.distance])
    const elapsed = parseDurationSeconds(cells[columns.duration], header[columns.duration])
    const completedAt = parseCompletedAt(cells[columns.date])
    const rowUnit = distanceUnitFor(header[columns.distance], fallbackUnit)
    const distance = distanceValue === null ? null : distanceValue * unitConfig(rowUnit).meters

    if (!completedAt || !distance || distance <= 0 || !elapsed || elapsed <= 0) {
      skipped += 1
      errors.push(`Row ${line}: needs a valid date, distance, and duration.`)
      continue
    }

    const key = `${completedAt}|${Math.round(distance)}|${elapsed}`
    if (seen.has(key)) {
      skipped += 1
      errors.push(`Row ${line}: duplicate of an earlier run in this file.`)
      continue
    }
    seen.add(key)

    if (rows.length >= MAX_IMPORT_ROWS) {
      skipped += 1
      continue
    }

    const meters = Math.round(distance)
    rows.push({
      id: stableId(key),
      title: columns.title >= 0 && String(cells[columns.title] ?? '').trim()
        ? String(cells[columns.title]).trim()
        : 'Imported run',
      completedAt,
      distance: meters,
      elapsed: Math.round(elapsed),
      distance_unit: fallbackUnit,
      pace: (elapsed / 60) / (meters / 1000), // internal minutes per km
      calories: columns.calories >= 0 ? Math.max(0, Math.round(Number(cells[columns.calories]) || 0)) : 0,
      steps: columns.steps >= 0 ? Math.max(0, Math.round(Number(cells[columns.steps]) || 0)) : 0,
      source: 'csv',
      splits: [],
    })
  }

  if (data.length > MAX_IMPORT_ROWS) {
    errors.push(`Only the first ${MAX_IMPORT_ROWS} runs were imported.`)
  }

  return { rows, errors, skipped }
}

export const SAMPLE_CSV = [
  'date,distance,duration,calories,steps',
  '2026-11-20,3.1,28:45,260,4200',
  '2026-11-22,2.4,22:10,205,3300',
].join('\n')
