import { useEffect, useState } from 'react';
import { resolveTheme } from '@/lib/theme';

// Static wallpaper layer. The resolved wallpaper lives on <html> (set by the
// boot script or applyResolvedTheme), so this component only mirrors that DOM
// state into a class. No canvas, timers, or motion — the wallpaper is styled
// once in CSS and never animates.

function readWallpaper() {
  if (typeof document === 'undefined') return resolveTheme('cosmic');
  const saved = document.documentElement.dataset.theme;
  return ['cosmic', 'alabaster'].includes(saved) ? saved : 'cosmic';
}

export default function Wallpaper() {
  const [wallpaper, setWallpaper] = useState(readWallpaper);

  useEffect(() => {
    // Recompute on every attribute change: applyResolvedTheme can update the
    // class and data-theme in one pass.
    const sync = () => setWallpaper(readWallpaper());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    const onStorage = (event) => {
      if (!event.key || event.key === 'xfit-theme') sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-wallpaper={wallpaper}
      className={`fixed inset-0 -z-10 pointer-events-none wallpaper wallpaper-${wallpaper}`}
    >
      <span className="wallpaper-layer wallpaper-layer-base" />
      <span className="wallpaper-layer wallpaper-layer-shape wallpaper-layer-shape-one" />
      <span className="wallpaper-layer wallpaper-layer-shape wallpaper-layer-shape-two" />
      <span className="wallpaper-layer wallpaper-layer-glow" />
    </div>
  );
}
