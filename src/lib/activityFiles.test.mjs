import assert from 'node:assert/strict'
import test from 'node:test'
import { parseActivityFile } from './activityFiles.js'

const GPX = `<gpx version="1.1"><trk><name>Morning Run</name><trkseg>
  <trkpt lat="37.7749" lon="-122.4194"><time>2026-11-20T07:00:00Z</time></trkpt>
  <trkpt lat="37.7759" lon="-122.4194"><time>2026-11-20T07:05:00Z</time></trkpt>
  <trkpt lat="37.7769" lon="-122.4194"><time>2026-11-20T07:10:00Z</time></trkpt>
</trkseg></trk></gpx>`

const TCX = `<TrainingCenterDatabase><Activities><Activity Sport="Running">
  <Id>2026-11-22T08:00:00Z</Id>
  <Lap StartTime="2026-11-22T08:00:00Z">
    <TotalTimeSeconds>900.0</TotalTimeSeconds>
    <DistanceMeters>3000.0</DistanceMeters>
    <Calories>280</Calories>
    <Track>
      <Trackpoint><Time>2026-11-22T08:00:00Z</Time><Position><LatitudeDegrees>37.7749</LatitudeDegrees><LongitudeDegrees>-122.4194</LongitudeDegrees></Position></Trackpoint>
      <Trackpoint><Time>2026-11-22T08:15:00Z</Time><Position><LatitudeDegrees>37.7849</LatitudeDegrees><LongitudeDegrees>-122.4194</LongitudeDegrees></Position></Trackpoint>
    </Track>
  </Lap>
</Activity></Activities></TrainingCenterDatabase>`

test('parseActivityFile reads GPX tracks with distance and elapsed time', () => {
  const { rows, errors, format } = parseActivityFile(GPX, 'morning.gpx', { unit: 'kilometers' })
  assert.equal(format, 'gpx')
  assert.equal(errors.length, 0)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].title, 'Morning Run')
  assert.equal(rows[0].elapsed, 600)
  assert.ok(rows[0].distance > 200 && rows[0].distance < 240)
  assert.equal(rows[0].source, 'gpx')
  assert.equal(rows[0].distance_unit, 'kilometers')
})

test('parseActivityFile reads TCX lap totals and calories', () => {
  const { rows, errors, format } = parseActivityFile(TCX, 'run.tcx')
  assert.equal(format, 'tcx')
  assert.equal(errors.length, 0)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].distance, 3000)
  assert.equal(rows[0].elapsed, 900)
  assert.equal(rows[0].calories, 280)
  assert.equal(rows[0].title, 'Imported run')
  assert.equal(rows[0].source, 'tcx')
})

test('parseActivityFile falls back to CSV for .csv files', () => {
  const csv = 'date,distance,duration\n2026-11-20,3,28:00\n'
  const { rows, format } = parseActivityFile(csv, 'runs.csv')
  assert.equal(format, 'csv')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].elapsed, 1680)
})

test('parseActivityFile reports empty GPX files', () => {
  const result = parseActivityFile('<gpx></gpx>', 'empty.gpx')
  assert.deepEqual(result.rows, [])
  assert.match(result.errors[0], /No tracks/)
})

test('duplicate GPX tracks collapse into one run', () => {
  const doubled = GPX.replace('</gpx>', '') + GPX.replace(/^[\s\S]*?<gpx[^>]*>/, '')
  const { rows, errors } = parseActivityFile(doubled, 'doubled.gpx')
  assert.equal(rows.length, 1)
  assert.match(errors.join(' '), /duplicate/)
})

test('GPX import ids are stable', () => {
  const first = parseActivityFile(GPX, 'a.gpx').rows[0]
  const second = parseActivityFile(GPX, 'b.gpx').rows[0]
  assert.equal(first.id, second.id)
})
