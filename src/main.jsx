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

// Apply the saved theme before the first React paint so the boot shell, the
// logo, and the app background never flash the wrong mode.
applyResolvedTheme(resolveTheme(getThemeMode()))

// Register the PWA worker after the page has loaded so it never competes with
// the critical rendering path. VitePWA's auto-update worker handles activation.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
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
