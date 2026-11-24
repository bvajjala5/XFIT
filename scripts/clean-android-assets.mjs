// Capacitor's copy step overwrites files but does not remove stale hashed
// bundles from earlier builds. Clear the generated web assets first so every
// `cap:sync` produces a clean Android asset directory.
import fs from 'node:fs'
import path from 'node:path'

const assets = path.resolve('android/app/src/main/assets/public')
fs.rmSync(assets, { recursive: true, force: true })
