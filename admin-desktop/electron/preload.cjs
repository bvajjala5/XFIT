// Preload runs in an isolated context with Node access, and exposes a tiny,
// explicit API to the renderer. The renderer never touches Firebase or Node.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('admin', {
  isDesktop: true,
  config: () => ipcRenderer.invoke('admin:config'),
  overview: () => ipcRenderer.invoke('admin:overview'),
  listUsers: (params) => ipcRenderer.invoke('admin:listUsers', params),
  getUser: (uid) => ipcRenderer.invoke('admin:getUser', uid),
  setRole: (uid, role) => ipcRenderer.invoke('admin:setRole', uid, role),
  setSuspended: (uid, suspended) => ipcRenderer.invoke('admin:setSuspended', uid, suspended),
})
