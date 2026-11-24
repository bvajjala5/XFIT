import { mockBridge } from './mock'

// Inside Electron the preload script defines `window.admin`. In a plain browser
// we fall back to the in-memory mock so the UI is fully previewable.
const bridge = (typeof window !== 'undefined' && window.admin) || mockBridge

export const isDesktop = Boolean(typeof window !== 'undefined' && window.admin)
export const isMock = !isDesktop

async function unwrap(promise) {
  const result = await promise
  if (!result || result.ok !== true) {
    throw new Error(result?.error || 'The request failed.')
  }
  return result.data
}

export const api = {
  config: () => unwrap(bridge.config()),
  overview: () => unwrap(bridge.overview()),
  analytics: () => unwrap(bridge.analytics()),
  listUsers: (params) => unwrap(bridge.listUsers(params)),
  getUser: (uid) => unwrap(bridge.getUser(uid)),
  setRole: (uid, role) => unwrap(bridge.setRole(uid, role)),
  setSuspended: (uid, suspended) => unwrap(bridge.setSuspended(uid, suspended)),
}
