import { useEffect, useState } from 'react'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'

/**
 * Public pages always follow the app's Auto theme (sunrise 6am–7pm, midnight
 * otherwise) so a visitor's first impression matches the live product. The
 * visitor's saved preference is restored when they leave the page.
 *
 * Returns the currently resolved theme ("sunrise" | "midnight") so callers can
 * render theme-specific content — e.g. the landing hero only mounts the poster
 * for the active theme, so the hidden one is never requested. The initial value
 * matches the inline boot script and the hero preload in index.html.
 */
export default function useAutoTheme() {
  const [resolved, setResolved] = useState(() => resolveTheme('auto'))

  useEffect(() => {
    const apply = () => setResolved(applyResolvedTheme(resolveTheme('auto')))
    apply()

    const timer = window.setInterval(apply, 60_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') apply()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      applyResolvedTheme(resolveTheme(getThemeMode()))
    }
  }, [])

  return resolved
}
