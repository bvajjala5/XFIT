import { mapRunRows, MAX_IMPORT_ROWS, stableId } from './csvImport.js'

// GPX and TCX exports describe one activity per track/Activity element. The
// files are parsed on the device; only the previewed summaries are ever saved.

function tagText(block, tag) {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return null
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim()
}

function attrText(attrs, name) {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match ? match[1].trim() : null
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(number) ? number : null
}

function isoTime(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function haversine(a, b) {
  const R = 6371000
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function positionFrom(block) {
  const lat = toNumber(tagText(block, 'LatitudeDegrees') ?? attrText(block, 'lat'))
  const lon = toNumber(tagText(block, 'LongitudeDegrees') ?? attrText(block, 'lon'))
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null
}

function pathStats(points) {
  let distance = 0
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].position && points[i - 1].position) {
      distance += haversine(points[i - 1].position, points[i].position)
    }
  }
  const times = points.map((point) => point.time).filter(Boolean)
  const elapsed = times.length >= 2
    ? (new Date(times[times.length - 1]).getTime() - new Date(times[0]).getTime()) / 1000
    : null
  return { distance, elapsed, startedAt: times[0] || null }
}

function makeRow({ key, title, completedAt, distance, elapsed, calories = 0, steps = 0, unit, source }) {
  const meters = Math.round(distance)
  const seconds = Math.round(elapsed)
  return {
    id: stableId(key),
    title,
    completedAt,
    distance: meters,
    elapsed: seconds,
    distance_unit: unit,
    pace: (seconds / 60) / (meters / 1000),
    calories: Math.max(0, Math.round(calories) || 0),
    steps: Math.max(0, Math.round(steps) || 0),
    source,
    splits: [],
  }
}

function parseGpx(text, unit) {
  const rows = []
  const errors = []
  const seen = new Set()
  const tracks = [...text.matchAll(/<trk(?:\s[^>]*)?>([\s\S]*?)<\/trk>/gi)]
  if (tracks.length === 0) {
    return { rows, errors: ['No tracks found in this GPX file.'], skipped: 0, format: 'gpx' }
  }

  tracks.forEach((track, index) => {
    const body = track[1]
    const points = [...body.matchAll(/<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/gi)].map((point) => ({
      position: positionFrom(point[1]),
      time: isoTime(tagText(point[2], 'time')),
    }))
    const { distance, elapsed, startedAt } = pathStats(points)
    const completedAt = startedAt || isoTime(tagText(body, 'time'))
    if (!completedAt || !distance || distance <= 0 || !elapsed || elapsed <= 0) {
      errors.push(`Track ${index + 1}: needs dated track points with a measurable distance.`)
      return
    }
    const key = `${completedAt}|${Math.round(distance)}|${Math.round(elapsed)}`
    if (seen.has(key)) {
      errors.push(`Track ${index + 1}: duplicate of an earlier run in this file.`)
      return
    }
    seen.add(key)
    if (rows.length >= MAX_IMPORT_ROWS) return
    rows.push(makeRow({
      key,
      title: tagText(body, 'name') || `Imported run ${index + 1}`,
      completedAt,
      distance,
      elapsed,
      unit,
      source: 'gpx',
    }))
  })

  return { rows, errors, skipped: tracks.length - rows.length, format: 'gpx' }
}

function parseTcx(text, unit) {
  const rows = []
  const errors = []
  const seen = new Set()
  const activities = [...text.matchAll(/<Activity\b([^>]*)>([\s\S]*?)<\/Activity>/gi)]
  if (activities.length === 0) {
    return { rows, errors: ['No activities found in this TCX file.'], skipped: 0, format: 'tcx' }
  }

  activities.forEach((activity, index) => {
    const body = activity[2]
    const sport = attrText(activity[1], 'Sport') || 'Running'
    const laps = [...body.matchAll(/<Lap\b[^>]*>([\s\S]*?)<\/Lap>/gi)].map((lap) => lap[1])
    const sum = (tag) => laps.reduce((total, lap) => total + (toNumber(tagText(lap, tag)) || 0), 0)

    let distance = sum('DistanceMeters')
    let elapsed = sum('TotalTimeSeconds')
    let completedAt = isoTime(tagText(body, 'Id'))
    const points = [...body.matchAll(/<Trackpoint\b[^>]*>([\s\S]*?)<\/Trackpoint>/gi)].map((point) => ({
      position: positionFrom(point[1]),
      time: isoTime(tagText(point[1], 'Time')),
    }))
    if (points.length > 0) {
      const stats = pathStats(points)
      if (!distance) distance = stats.distance
      if (!elapsed) elapsed = stats.elapsed
      if (!completedAt) completedAt = stats.startedAt
    }

    if (!completedAt || !distance || distance <= 0 || !elapsed || elapsed <= 0) {
      errors.push(`Activity ${index + 1}: needs a time, distance, and duration.`)
      return
    }
    const key = `${completedAt}|${Math.round(distance)}|${Math.round(elapsed)}`
    if (seen.has(key)) {
      errors.push(`Activity ${index + 1}: duplicate of an earlier run in this file.`)
      return
    }
    seen.add(key)
    if (rows.length >= MAX_IMPORT_ROWS) return
    rows.push(makeRow({
      key,
      title: /running/i.test(sport) ? 'Imported run' : `Imported ${sport.toLowerCase()}`,
      completedAt,
      distance,
      elapsed,
      calories: sum('Calories'),
      unit,
      source: 'tcx',
    }))
  })

  return { rows, errors, skipped: activities.length - rows.length, format: 'tcx' }
}

export const MAX_IMPORT_FILES = 10

/** Parse a Strava/device export by file type into the shared run shape. */
export function parseActivityFile(text, filename = '', { unit = 'miles' } = {}) {
  const extension = String(filename).toLowerCase().split('.').pop()
  if (extension === 'gpx') return parseGpx(String(text ?? ''), unit)
  if (extension === 'tcx') return parseTcx(String(text ?? ''), unit)
  return { ...mapRunRows(text, { unit }), format: 'csv' }
}

/** Parse several selected files into one preview, deduplicated across files. */
export function parseActivityFiles(files, { unit = 'miles' } = {}) {
  const selected = files.slice(0, MAX_IMPORT_FILES)
  const rows = []
  const errors = []
  const formats = new Set()
  const seen = new Set()
  let skipped = files.length - selected.length

  if (skipped > 0) errors.push(`Only the first ${MAX_IMPORT_FILES} files were checked.`)

  selected.forEach((file) => {
    const parsed = parseActivityFile(file.text, file.name, { unit })
    formats.add(parsed.format)
    const label = (message) => (selected.length > 1 ? `${file.name}: ${message}` : message)
    parsed.errors.forEach((error) => errors.push(label(error)))
    skipped += parsed.skipped

    parsed.rows.forEach((row) => {
      if (seen.has(row.id)) {
        skipped += 1
        errors.push(label('duplicate of a run in another file'))
        return
      }
      if (rows.length >= MAX_IMPORT_ROWS) {
        skipped += 1
        return
      }
      seen.add(row.id)
      rows.push(row)
    })
  })

  const list = [...formats]
  return {
    rows,
    errors,
    skipped,
    formats: list,
    format: list.length === 1 ? list[0] : 'mixed',
  }
}

export const SAMPLE_GPX = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<gpx version="1.1" creator="Uttar Fitness">',
  '  <trk><name>Morning Run</name><trkseg>',
  '    <trkpt lat="37.7749" lon="-122.4194"><time>2026-11-20T07:00:00Z</time></trkpt>',
  '    <trkpt lat="37.7759" lon="-122.4194"><time>2026-11-20T07:05:00Z</time></trkpt>',
  '    <trkpt lat="37.7769" lon="-122.4194"><time>2026-11-20T07:10:00Z</time></trkpt>',
  '  </trkseg></trk>',
  '</gpx>',
].join('\n')

export const SAMPLE_TCX = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<TrainingCenterDatabase><Activities><Activity Sport="Running">',
  '  <Id>2026-11-22T08:00:00Z</Id>',
  '  <Lap StartTime="2026-11-22T08:00:00Z">',
  '    <TotalTimeSeconds>900</TotalTimeSeconds>',
  '    <DistanceMeters>3000</DistanceMeters>',
  '    <Calories>280</Calories>',
  '  </Lap>',
  '</Activity></Activities></TrainingCenterDatabase>',
].join('\n')
