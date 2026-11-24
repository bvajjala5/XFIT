import { useEffect } from 'react'
import { applyResolvedTheme, getThemeMode, msUntilNextThemeChange, THEME_KEY } from '@/lib/theme'

/**
 * Keeps Auto mode in sync with the local clock while the app is open. Auto is a
 * preference, not a background service: one timer is scheduled for the next
 * 7am/7pm boundary, and returning to the tab re-checks in case the timer was
 * throttled. Other modes leave no timer behind.
 */
export default function useAutoTheme() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined

    let timer
    const sync = () => {
      window.clearTimeout(timer)
      if (getThemeMode() !== 'auto') return
      applyResolvedTheme('auto')
      timer = window.setTimeout(sync, msUntilNextThemeChange())
    }

    const onStorage = (event) => {
      if (!event.key || event.key === THEME_KEY) sync()
    }
    const onVisible = () => {
      if (!document.hidden) sync()
    }

    sync()
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
