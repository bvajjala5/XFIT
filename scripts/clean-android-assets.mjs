// Capacitor's copy step overwrites files but does not remove stale generated
// files from earlier builds (macOS even renames duplicates to "config 2.xml").
// Clear everything capacitive regenerates so each `cap:sync` is clean.
import fs from 'node:fs'
import path from 'node:path'

const remove = (p) => fs.rmSync(path.resolve(p), { recursive: true, force: true })

remove('android/app/src/main/assets/public')
remove('android/app/src/main/assets/capacitor.config.json')
remove('android/app/src/main/assets/capacitor.plugins.json')

const xmlDir = path.resolve('android/app/src/main/res/xml')
if (fs.existsSync(xmlDir)) {
  for (const name of fs.readdirSync(xmlDir)) {
    if (/^config( \d+)?\.xml$/.test(name)) fs.rmSync(path.join(xmlDir, name))
  }
}
