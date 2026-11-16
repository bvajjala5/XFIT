import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, shell } from 'electron'
import { registerIpc } from './ipc.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const devServerUrl = process.env.VITE_DEV_SERVER_URL

// The admin app's icon is the inverted Uttar mark (black on white), so it is
// easy to tell apart from the main app (white on black) in the dock/taskbar.
const iconPath = path.join(__dirname, 'icon.png')

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'Uttar Fitness Admin Control Hub',
    icon: iconPath,
    backgroundColor: '#0b0f17',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the user's browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  return win
}

app.whenReady().then(() => {
  // macOS ignores `BrowserWindow.icon`, so set the dock icon explicitly. This
  // is what makes the inverted mark visible while running `npm start`.
  if (process.platform === 'darwin' && app.dock) app.dock.setIcon(iconPath)

  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
