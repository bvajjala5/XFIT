// Quick check that the privileged data layer loads and reads config without
// needing a live Firebase connection. Run with: npm run smoke
import { getConfig } from '../electron/data.js'

const config = getConfig()

console.log('Uttar Fitness Admin Control Hub — smoke test')
console.log('  project id :', config.projectId || '(not set)')
console.log('  env file   :', config.envPath)
console.log('  configured :', config.configured)

if (typeof config.configured !== 'boolean') {
  console.error('FAIL: getConfig() did not return a configured flag.')
  process.exit(1)
}

console.log('OK: the admin data layer loads and reads configuration.')
