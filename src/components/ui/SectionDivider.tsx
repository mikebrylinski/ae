import { cn } from '@/lib/utils'

interface SectionDividerProps {
  className?: string
}

/**
 * 3px animated lime/black gradient rule between major sections.
 * Prefer the `section-divider-top` class on a section when the border
 * should sit on that section’s top edge; use this element when you need
 * an explicit separator between siblings.
 */
export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div
      className={cn('section-divider', className)}
      role="separator"
      aria-hidden
    />
  )
}
