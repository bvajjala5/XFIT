import assert from 'node:assert/strict'
import test from 'node:test'
import { parseActivityFile, parseActivityFiles, SAMPLE_GPX, SAMPLE_TCX } from './activityFiles.js'

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

test('downloadable samples parse into one run each', () => {
  const gpx = parseActivityFile(SAMPLE_GPX, 'sample.gpx')
  const tcx = parseActivityFile(SAMPLE_TCX, 'sample.tcx')
  assert.equal(gpx.errors.length, 0)
  assert.equal(gpx.rows.length, 1)
  assert.equal(tcx.errors.length, 0)
  assert.equal(tcx.rows.length, 1)
})

test('parseActivityFiles merges several files and reports mixed formats', () => {
  const csv = 'date,distance,duration\n2026-11-24,5,45:00\n'
  const result = parseActivityFiles([
    { name: 'runs.csv', text: csv },
    { name: 'morning.gpx', text: GPX },
    { name: 'run.tcx', text: TCX },
  ])
  assert.equal(result.rows.length, 3)
  assert.equal(result.errors.length, 0)
  assert.deepEqual(result.formats.sort(), ['csv', 'gpx', 'tcx'])
  assert.equal(result.format, 'mixed')
})

test('parseActivityFiles deduplicates across files', () => {
  const result = parseActivityFiles([
    { name: 'first.gpx', text: GPX },
    { name: 'copy.gpx', text: GPX },
  ])
  assert.equal(result.rows.length, 1)
  assert.equal(result.skipped, 1)
  assert.match(result.errors[0], /copy\.gpx.*duplicate/)
})

test('parseActivityFiles caps the number of files', () => {
  const files = Array.from({ length: 12 }, (_, index) => ({
    name: `runs-${index}.csv`,
    text: `date,distance,duration\n2026-11-${String(index + 1).padStart(2, '0')},3,28:00\n`,
  }))
  const result = parseActivityFiles(files)
  assert.equal(result.rows.length, 10)
  assert.match(result.errors.join(' '), /first 10 files/)
})
