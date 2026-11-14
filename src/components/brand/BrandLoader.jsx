
const SIZES = {
  xs: { tile: 'h-7 w-7 rounded-lg', mark: 'w-5' },
  sm: { tile: 'h-10 w-10 rounded-xl', mark: 'w-7' },
  md: { tile: 'h-14 w-14 rounded-2xl', mark: 'w-11' },
  lg: { tile: 'h-24 w-24 rounded-[1.75rem]', mark: 'w-[4.5rem]' },
}

/**
 * The app's loading mark: the barbell logo with the U in the middle spinning.
 * The tile inverts with the theme just like the static logo.
 */
export default function BrandLoader({ size = 'md', className = '', label }) {
  const s = SIZES[size] ?? SIZES.md
  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      <span
        className={`relative flex items-center justify-center overflow-hidden bg-[hsl(var(--brand-tile))] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] ring-1 ring-[hsl(var(--brand-mark)/0.22)] ${s.tile}`}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,hsl(var(--brand-mark)/0.16),transparent_65%)]" />
        <span className={`brand-loader shrink-0 ${s.mark}`}>
          <span className="brand-loader-frame" />
          <span className="brand-loader-u" />
        </span>
      </span>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}
