// Distances are always measured and stored in meters. These helpers only
// convert for display, using the distance_unit saved on the user's profile.

const UNITS = {
  miles: { label: 'Miles', short: 'MI', meters: 1609.344, decimals: 2, segmentMeters: 1609.344, segmentLabel: 'MI' },
  kilometers: { label: 'Kilometers', short: 'KM', meters: 1000, decimals: 2, segmentMeters: 1000, segmentLabel: 'KM' },
  meters: { label: 'Meters', short: 'M', meters: 1, decimals: 0, segmentMeters: 100, segmentLabel: '100M' },
}

export function normalizeDistanceUnit(value) {
  return Object.prototype.hasOwnProperty.call(UNITS, value) ? value : 'miles'
}

export function unitConfig(value) {
  return UNITS[normalizeDistanceUnit(value)]
}

export function formatDistance(meters, unit) {
  const config = unitConfig(unit)
  const value = (Number(meters) || 0) / config.meters
  return value.toLocaleString(undefined, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  })
}

// Internal pace is minutes per kilometer. Convert it to minutes per the
// user's preferred segment: a mile, a kilometer, or 100 meters.
export function formatPace(elapsedSeconds, distanceMeters, unit) {
  const meters = Number(distanceMeters) || 0
  const seconds = Number(elapsedSeconds) || 0
  if (meters <= 0 || seconds <= 0) return '--:--'

  const config = unitConfig(unit)
  const minutes = (seconds / 60) / (meters / config.segmentMeters)
  if (!Number.isFinite(minutes) || minutes <= 0) return '--:--'

  const whole = Math.floor(minutes)
  const remainder = Math.round((minutes - whole) * 60)
  return remainder === 60 ? `${whole + 1}:00` : `${whole}:${String(remainder).padStart(2, '0')}`
}

export function splitMeters(unit) {
  return unitConfig(unit).segmentMeters
}

export function splitLabel(index, unit) {
  return `${unitConfig(unit).short} ${index}`
}

export function paceLabel(unit) {
  return `MIN/${unitConfig(unit).segmentLabel}`
}
