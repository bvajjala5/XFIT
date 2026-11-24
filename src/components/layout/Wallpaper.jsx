import { useEffect, useState } from 'react';
import { getGradientColors, resolveTheme } from '@/lib/theme';

// Static wallpaper layer. The resolved wallpaper lives on <html> (set by the
// boot script or applyResolvedTheme), so this component only mirrors that DOM
// state into a class. No canvas, timers, or motion — the ambient shapes are
// styled once in CSS and never animate.

function readWallpaper() {
  if (typeof document === 'undefined') return resolveTheme('cosmic');
  const saved = document.documentElement.dataset.theme;
  return ['cosmic', 'alabaster', 'gradient'].includes(saved) ? saved : 'cosmic';
}

export default function Wallpaper() {
  const [wallpaper, setWallpaper] = useState(readWallpaper);
  const [colors, setColors] = useState(getGradientColors);

  useEffect(() => {
    // Recompute on every attribute change: applyResolvedTheme can update the
    // class, data-theme, and gradient custom properties in one pass.
    const sync = () => {
      setWallpaper(readWallpaper());
      setColors(getGradientColors());
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    const onStorage = (event) => {
      if (!event.key || event.key === 'xfit-gradient-colors') sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const style = wallpaper === 'gradient'
    ? {
      '--wallpaper-from': colors[0],
      '--wallpaper-to': colors[1],
      backgroundImage: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
    }
    : undefined;

  return (
    <div
      aria-hidden="true"
      data-wallpaper={wallpaper}
      className={`fixed inset-0 z-0 pointer-events-none wallpaper wallpaper-${wallpaper}`}
      style={style}
    >
      <span className="wallpaper-layer wallpaper-layer-base" />
      <span className="wallpaper-layer wallpaper-layer-shape wallpaper-layer-shape-one" />
      <span className="wallpaper-layer wallpaper-layer-shape wallpaper-layer-shape-two" />
      <span className="wallpaper-layer wallpaper-layer-glow" />
    </div>
  );
}
