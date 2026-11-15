import { ipcMain } from 'electron'
import {
  getConfig,
  getOverview,
  listUsers,
  getUser,
  setRole,
  setSuspended,
} from './data.js'

function ok(data) {
  return { ok: true, data }
}

function fail(error) {
  return { ok: false, error: error?.message || String(error) }
}

/**
 * Every renderer request goes through here. Handlers never throw across the
 * IPC boundary; they return `{ ok, data }` or `{ ok, error }` so the UI can
 * show a friendly message instead of a serialized stack trace.
 */
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return ok(await fn(...args))
    } catch (error) {
      console.error(`[ipc] ${channel} failed:`, error)
      return fail(error)
    }
  })
}

export function registerIpc() {
  handle('admin:config', () => getConfig())
  handle('admin:overview', () => getOverview())
  handle('admin:listUsers', (params) => listUsers(params || {}))
  handle('admin:getUser', (uid) => getUser(uid))
  handle('admin:setRole', (uid, role) => setRole({ uid, role }))
  handle('admin:setSuspended', (uid, suspended) => setSuspended({ uid, suspended }))
}
