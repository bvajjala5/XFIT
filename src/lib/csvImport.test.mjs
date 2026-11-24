import assert from 'node:assert/strict'
import test from 'node:test'
import { mapRunRows, parseCsv, parseDurationSeconds } from './csvImport.js'
import { unitConfig } from './distanceUnits.js'

test('parseCsv handles BOM, CRLF, quoted commas, and escaped quotes', () => {
  const rows = parseCsv('\uFEFFdate,name\r\n2026-11-20,"Morning, easy"\r\n2026-11-21,"a ""quoted"" run"\r\n')
  assert.deepEqual(rows[0], ['date', 'name'])
  assert.deepEqual(rows[1], ['2026-11-20', 'Morning, easy'])
  assert.deepEqual(rows[2], ['2026-11-21', 'a "quoted" run'])
})

test('parseDurationSeconds reads clock, units, and bare minutes', () => {
  assert.equal(parseDurationSeconds('28:45'), 1725)
  assert.equal(parseDurationSeconds('1:02:10'), 3730)
  assert.equal(parseDurationSeconds('1h 5m 10s'), 3910)
  assert.equal(parseDurationSeconds('30'), 1800)
  assert.equal(parseDurationSeconds('30', 'Duration (seconds)'), 30)
  assert.equal(parseDurationSeconds('nope'), null)
})

test('mapRunRows converts miles and keeps optional nutrition columns', () => {
  const csv = [
    'date,distance,duration,calories,steps',
    '2026-11-20,3.1,28:45,260,4200',
    '2026-11-22,2.4,22:10,205,3300',
  ].join('\n')

  const { rows, errors, skipped } = mapRunRows(csv, { unit: 'miles' })
  assert.equal(errors.length, 0)
  assert.equal(skipped, 0)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].distance, Math.round(3.1 * unitConfig('miles').meters))
  assert.equal(rows[0].elapsed, 1725)
  assert.equal(rows[0].calories, 260)
  assert.equal(rows[0].steps, 4200)
  assert.equal(rows[0].distance_unit, 'miles')
  assert.equal(rows[0].source, 'csv')
  assert.ok(Math.abs(rows[0].pace - (1725 / 60) / (rows[0].distance / 1000)) < 1e-9)
})

test('mapRunRows reads Strava-style headers and kilometre distances', () => {
  const csv = [
    'Activity Date,Activity Name,Activity Type,Distance (km),Moving Time',
    '11/20/2026,Morning Run,Run,5.02,46:12',
  ].join('\n')

  const { rows, errors } = mapRunRows(csv, { unit: 'miles' })
  assert.equal(errors.length, 0)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].title, 'Morning Run')
  assert.equal(rows[0].distance, 5020)
  assert.equal(rows[0].elapsed, 2772)
})

test('mapRunRows reads a bare-minute duration column', () => {
  const csv = 'date,distance,duration (min)\n2026-11-20,5,32\n'
  const { rows, errors } = mapRunRows(csv, { unit: 'kilometers' })
  assert.equal(errors.length, 0)
  assert.equal(rows[0].elapsed, 1920)
})

test('invalid and duplicate rows are skipped with reasons', () => {
  const csv = [
    'date,distance,duration',
    '2026-11-20,3,28:00',
    'not-a-date,3,28:00',
    '2026-11-20,3,28:00',
  ].join('\n')

  const { rows, errors, skipped } = mapRunRows(csv)
  assert.equal(rows.length, 1)
  assert.equal(skipped, 2)
  assert.match(errors[0], /Row 3/)
  assert.match(errors[1], /duplicate/)
})

test('missing required columns report a clear error', () => {
  const result = mapRunRows('date,calories\n2026-11-20,300\n')
  assert.deepEqual(result.rows, [])
  assert.match(result.errors[0], /Missing a required column/)
})

test('import ids are stable so re-importing does not duplicate runs', () => {
  const csv = 'date,distance,duration\n2026-11-20,3,28:00\n'
  const first = mapRunRows(csv).rows[0]
  const second = mapRunRows(csv).rows[0]
  assert.equal(first.id, second.id)
  assert.match(first.id, /^csv-/)
})

test('large files are capped and say so', () => {
  const lines = ['date,distance,duration']
  for (let i = 0; i < 205; i += 1) {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString()
    lines.push(`${date},3,28:00`)
  }
  const { rows, errors, skipped } = mapRunRows(lines.join('\n'))
  assert.equal(rows.length, 200)
  assert.equal(skipped, 5)
  assert.match(errors.at(-1), /first 200/)
})
