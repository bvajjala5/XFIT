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

const container = document.getElementById('root')
// The HTML ships a lightweight boot shell so the first paint is not blank.
// Clear it before mounting so React owns the container.
container.replaceChildren()

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
