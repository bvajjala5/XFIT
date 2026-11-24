import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance as queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'
import { getPublicWallpaper } from '@/lib/publicWallpaper'
import { registerSW } from 'virtual:pwa-register'

// Match the inline boot script: Login always paints Alabaster, the landing and
// demo pages follow the shared preview mode (which may be Auto), and the
// signed-in app uses the saved mode. Keeping both in sync avoids a flash
// between the static shell and the first React paint.
const publicPath = window.location.pathname.replace(/\/+$/, '') || '/'
const isDemoPage = publicPath === '/' || publicPath === '/demo'
const initialTheme = publicPath === '/login'
  ? 'alabaster'
  : isDemoPage ? getPublicWallpaper() : resolveTheme(getThemeMode())
applyResolvedTheme(initialTheme)

// Register the PWA worker after the page has loaded so it never competes with
// the critical rendering path. registerSW() is the plugin's own entry point:
// with registerType 'autoUpdate' it reloads the page once a new worker takes
// over, so returning visitors never keep a stale shell from the previous build.
if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    registerSW({ immediate: true })
  }, { once: true })
}

const container = document.getElementById('root')
const boot = document.getElementById('boot')

function hideBoot() {
  if (!boot) return
  // Keep the node in the document: it already painted the first frame and is
  // the LCP candidate. Hiding (rather than removing) it leaves that candidate
  // addressable for metrics while keeping the DOM stable.
  boot.style.display = 'none'
  boot.setAttribute('aria-hidden', 'true')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// The static shell is a sibling of #root, so React mounting does not destroy
// the first painted frame. Reveal the app once React has committed, after a
// couple of frames so the shell's paint is registered as the LCP candidate.
let waited = 0
function revealWhenReady() {
  if (container.childElementCount > 0) {
    requestAnimationFrame(() => requestAnimationFrame(hideBoot))
    return
  }
  if (++waited > 600) {
    // Roughly 10 seconds: only hide if React never commits (e.g. a crashed
    // bundle) so visitors are not stuck on the splash forever. A slow but
    // working device keeps the splash until the app is actually ready.
    hideBoot()
    return
  }
  requestAnimationFrame(revealWhenReady)
}
requestAnimationFrame(revealWhenReady)
