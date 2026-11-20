import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDistanceUnit,
  unitConfig,
  formatDistance,
  formatPace,
  splitMeters,
  splitLabel,
  paceLabel,
} from './distanceUnits.js'

test('unknown and missing units fall back to miles', () => {
  assert.equal(normalizeDistanceUnit(undefined), 'miles')
  assert.equal(normalizeDistanceUnit('furlongs'), 'miles')
  assert.equal(unitConfig('miles').label, 'Miles')
})

test('distance converts to the saved unit', () => {
  assert.equal(formatDistance(1609.344, 'miles'), '1.00')
  assert.equal(formatDistance(5000, 'kilometers'), '5.00')
  assert.equal(formatDistance(1250, 'meters').replace(/,/g, ''), '1250')
  assert.equal(formatDistance(0, 'miles'), '0.00')
})

test('pace follows the distance unit', () => {
  // 2 km in 10 minutes = 5:00/km, 8:03/mi, 0:30 per 100 m.
  assert.equal(formatPace(600, 2000, 'kilometers'), '5:00')
  assert.equal(formatPace(600, 2000, 'miles'), '8:03')
  assert.equal(formatPace(600, 2000, 'meters'), '0:30')
  assert.equal(formatPace(0, 2000, 'miles'), '--:--')
})

test('splits and pace labels use the unit', () => {
  assert.equal(splitMeters('miles'), 1609.344)
  assert.equal(splitMeters('kilometers'), 1000)
  assert.equal(splitMeters('meters'), 100)
  assert.equal(splitLabel(2, 'miles'), 'MI 2')
  assert.equal(splitLabel(1, 'kilometers'), 'KM 1')
  assert.equal(paceLabel('miles'), 'MIN/MI')
  assert.equal(paceLabel('meters'), 'MIN/100M')
})
