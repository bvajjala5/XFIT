import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_NAME = 'Uttar Fitness Admin Control Hub'

/**
 * Where the packaged app looks for a per-user config file. This is the same
 * folder Electron uses for user data, so it survives moving the .app around.
 */
export function userDataDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME)
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), APP_NAME)
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), APP_NAME)
}

const devEnvPath = path.join(__dirname, '..', '.env')

// Look for `.env` in the places it can live: an explicit override, the project
// folder (development), or the per-user config folder (packaged app). The first
// one that exists wins.
const envCandidates = [
  process.env.XFIT_ADMIN_ENV,
  devEnvPath,
  path.join(userDataDir(), '.env'),
  process.resourcesPath ? path.join(process.resourcesPath, '.env') : null,
].filter(Boolean)

export const ENV_PATH =
  envCandidates.find((candidate) => {
    try {
      return fs.existsSync(candidate)
    } catch {
      return false
    }
  }) || devEnvPath

// Real environment variables win, because dotenv never overwrites values that
// are already set.
dotenv.config({ path: ENV_PATH, quiet: true })

let initError = null

export function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    null
  )
}

/** True when enough credentials are present to attempt a connection. */
export function isConfigured() {
  const hasInline = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  )
  return Boolean(
    hasInline ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  )
}

/** Lazily initialize the Admin app so the window can open before we connect. */
export function getAdmin() {
  if (admin.apps.length) return admin
  if (initError) throw initError

  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Pasted keys usually keep literal "\n" sequences; restore real newlines.
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // A relative path is resolved next to the .env file it came from, so the
      // packaged app can point at `./service-account.json` in its config folder.
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT
      const file = path.isAbsolute(raw) ? raw : path.resolve(path.dirname(ENV_PATH), raw)
      const serviceAccount = JSON.parse(fs.readFileSync(file, 'utf8'))
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || getProjectId(),
      })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: getProjectId(),
      })
    } else {
      throw new Error(
        'Firebase credentials are missing. Open admin-desktop/.env and fill in ' +
          'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.example).',
      )
    }
  } catch (error) {
    initError = error
    throw error
  }

  return admin
}

export function getAuth() {
  return getAdmin().auth()
}

export function getDb() {
  return getAdmin().firestore()
}
