import { useCallback, useEffect, useState } from 'react'
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme'
import { getPublicWallpaper, setPublicWallpaper, subscribePublicWallpaper } from '@/lib/publicWallpaper'

/**
 * Landing and the no-account demo share one preview wallpaper, so picking a
 * theme from the demo's Profile screen recolours both pages. The real saved
 * wallpaper is restored on unmount, keeping the signed-in app and Login
 * unaffected by a demo preview.
 */
export default function usePreviewWallpaper() {
  const [wallpaper, setWallpaper] = useState(getPublicWallpaper)

  useEffect(() => subscribePublicWallpaper(setWallpaper), [])

  useEffect(() => {
    applyResolvedTheme(wallpaper)
  }, [wallpaper])

  // A public page leaving puts the saved app wallpaper back in charge.
  useEffect(() => () => applyResolvedTheme(resolveTheme(getThemeMode())), [])

  const select = useCallback((next) => setPublicWallpaper(next), [])

  return [wallpaper, select]
}
