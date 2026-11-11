import { useEffect } from 'react'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'

/**
 * Public pages always follow the app's Auto theme (sunrise 6am–7pm, midnight
 * otherwise) so a visitor's first impression matches the live product. The
 * visitor's saved preference is restored when they leave the page.
 */
export default function useAutoTheme() {
  useEffect(() => {
    const apply = () => applyResolvedTheme(resolveTheme('auto'))
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
}
