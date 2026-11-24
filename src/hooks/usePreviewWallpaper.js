import { useCallback, useEffect, useState } from 'react'
import { applyResolvedTheme, getThemeMode, msUntilNextThemeChange, resolveTheme } from '@/lib/theme'
import { getPublicWallpaper, setPublicWallpaper, subscribePublicWallpaper } from '@/lib/publicWallpaper'

/**
 * Landing and the no-account demo share one preview wallpaper, so picking a
 * theme from the demo's Profile screen recolours both pages. The real saved
 * wallpaper is restored on unmount, keeping the signed-in app and Login
 * unaffected by a demo preview. Auto follows the same clock as the app.
 */
export default function usePreviewWallpaper() {
  const [mode, setMode] = useState(getPublicWallpaper)

  useEffect(() => subscribePublicWallpaper(setMode), [])

  useEffect(() => {
    if (mode !== 'auto') {
      applyResolvedTheme(mode)
      return undefined
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined

    let timer
    const sync = () => {
      applyResolvedTheme('auto')
      window.clearTimeout(timer)
      timer = window.setTimeout(sync, msUntilNextThemeChange())
    }
    const onVisible = () => {
      if (!document.hidden) sync()
    }
    sync()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [mode])

  // A public page leaving puts the saved app wallpaper back in charge.
  useEffect(() => () => applyResolvedTheme(resolveTheme(getThemeMode())), [])

  const select = useCallback((next) => setPublicWallpaper(next), [])

  return [mode, select]
}
