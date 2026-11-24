import { useEffect } from 'react'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'

/**
 * The sign-in page always shows the crisp alabaster wallpaper, whatever the
 * visitor has saved. The saved wallpaper is restored when the page unmounts, so
 * navigating into the signed-in app honours it. Landing and the demo share a
 * preview wallpaper instead (see usePreviewWallpaper).
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
