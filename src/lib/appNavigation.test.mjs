import test from 'node:test'
import assert from 'node:assert/strict'
import {
  APP_DESTINATIONS,
  describeLocation,
  extractNavActions,
  findNavSuggestions,
  resolveNavActions,
} from './appNavigation.js'

test('app directory only advertises paths the router understands', () => {
  const paths = APP_DESTINATIONS.map((destination) => destination.path)
  assert.equal(new Set(paths).size, paths.length)
  for (const path of paths) assert.match(path, /^\//)
})

test('resolveNavActions keeps allowlisted paths and normalizes aliases', () => {
  const actions = resolveNavActions([{ path: '/settings', label: 'Go to settings' }])
  assert.deepEqual(actions.map((action) => action.path), ['/profile#profile-settings'])
  assert.equal(actions[0].label, 'Go to settings')
})

test('resolveNavActions drops unknown paths and duplicates', () => {
  const actions = resolveNavActions([
    { path: '/definitely-not-a-screen', label: 'Nope' },
    { path: '/plan', label: 'Open weekly plan' },
    { path: '/plan', label: 'Open weekly plan again' },
    { path: '/health?tab=overview' },
  ])
  assert.deepEqual(actions.map((action) => action.path), ['/plan', '/insights'])
})

test('resolveNavActions accepts a parsed object and caps the list', () => {
  const actions = resolveNavActions({
    actions: [
      { path: '/plan' },
      { path: '/builder' },
      { path: '/stats' },
      { path: '/profile' },
    ],
  })
  assert.equal(actions.length, 3)
})

test('extractNavActions strips the block from prose and validates buttons', () => {
  const reply = 'Open Profile and tap Edit on the Profile Settings card.\n<nav>{"actions":[{"label":"Go to Profile settings","path":"/profile#profile-settings"}]}</nav>'
  const { text, actions } = extractNavActions(reply)
  assert.equal(text, 'Open Profile and tap Edit on the Profile Settings card.')
  assert.deepEqual(actions.map((action) => action.path), ['/profile#profile-settings'])
})

test('extractNavActions reads the fenced variant', () => {
  const reply = 'Your food diary lives in Health.\n```nav\n{"actions":[{"path":"/health?tab=nutrition","label":"Open food diary"}]}\n```'
  const { text, actions } = extractNavActions(reply)
  assert.equal(text, 'Your food diary lives in Health.')
  assert.deepEqual(actions.map((action) => action.path), ['/insights?tab=nutrition'])
})

test('extractNavActions leaves ordinary replies untouched', () => {
  const reply = 'Aim for 1.6–2.2 g of protein per kg of body weight.'
  const { text, actions } = extractNavActions(reply)
  assert.equal(text, reply)
  assert.deepEqual(actions, [])
})

test('findNavSuggestions rescues clear where/how questions', () => {
  assert.deepEqual(
    findNavSuggestions('How do I change my app theme?').map((action) => action.path),
    ['/profile#app-theme']
  )
  assert.deepEqual(
    findNavSuggestions('Where can I see my workout history?').map((action) => action.path),
    ['/history']
  )
})

test('findNavSuggestions ignores questions that are not about the app', () => {
  assert.deepEqual(findNavSuggestions('How much protein should I eat?'), [])
})

test('old Health and Stats links resolve into Insights', () => {
  assert.deepEqual(
    resolveNavActions([
      { path: '/health' },
      { path: '/stats' },
      { path: '/weight' },
    ]).map((action) => action.path),
    ['/insights', '/insights?view=stats', '/insights?tab=weight']
  )
  assert.deepEqual(
    resolveNavActions([{ path: '/food' }]).map((action) => action.path),
    ['/insights?tab=nutrition']
  )
})

test('describeLocation names the current screen', () => {
  assert.equal(describeLocation('/insights', '?tab=weight'), 'Insights · Health · Weight (/insights?tab=weight)')
  assert.equal(describeLocation('/insights', '?view=stats'), 'Insights · Stats (/insights?view=stats)')
  assert.equal(describeLocation('/profile'), 'Profile (/profile)')
  assert.match(describeLocation('/workouts/abc'), /Workout details/)
})
