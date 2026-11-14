
/**
 * The Uttar barbell emblem, drawn with a CSS mask so its colour follows the
 * active theme (white on midnight, black on sunrise).
 */
export function BrandEmblem({ className = '' }) {
  return <span aria-hidden="true" className={`brand-emblem ${className}`} />
}

/**
 * The emblem inside a rounded tile. Use `emblemClassName` to size the mark
 * relative to the tile (a width class works best).
 */
export default function BrandMark({
  className = '',
  emblemClassName = 'w-2/3',
  label = 'Uttar Fitness',
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-[hsl(var(--brand-tile))] ring-1 ring-[hsl(var(--brand-mark)/0.22)] ${className}`}
    >
      <BrandEmblem className={emblemClassName} />
    </span>
  )
}
