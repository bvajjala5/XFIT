import { useEffect } from 'react'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'

/**
 * Public pages (Landing, Demo, Login) always show the crisp alabaster
 * wallpaper, whatever the visitor has saved. The saved wallpaper is restored
 * when the page unmounts, so navigating into the signed-in app honours it.
 *
 * Returns the wallpaper in use ("alabaster") for callers that need to render
 * matching content. There is no clock, timer, or theme swapping here.
 */
export default function usePublicWallpaper() {
  useEffect(() => {
    const saved = resolveTheme(getThemeMode())
    applyResolvedTheme('alabaster')
    return () => applyResolvedTheme(saved)
  }, [])

  return 'alabaster'
}
