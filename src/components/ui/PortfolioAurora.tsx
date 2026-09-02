import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasSafariClass } from '@/lib/safari'
import { cn } from '@/lib/utils'

/**
 * Small animated lime wash + soft top highlight for portfolio page backgrounds.
 * Pointer-events none — sits behind section content.
 */
export function PortfolioAurora() {
  const reduced = useReducedMotion()
  const staticWash = reduced || hasSafariClass()

  return (
    <div
      aria-hidden
      className={cn(
        'portfolio-aurora',
        staticWash && 'portfolio-aurora--static',
      )}
    >
      <div className="portfolio-aurora__wash" />
      <div className="portfolio-aurora__highlight" />
    </div>
  )
}
