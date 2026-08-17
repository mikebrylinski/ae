import { cn } from '@/lib/utils'

interface NoiseOverlayProps {
  className?: string
  /** 0–1 opacity of the grit layer. Default is arena-subtle. */
  opacity?: number
  /** When true, covers the viewport and stays fixed (global film grain). */
  fixed?: boolean
}

/**
 * Subtle grit for arena / rock-show atmosphere.
 * Uses a static PNG — SVG feTurbulence freezes Safari.
 */
export function NoiseOverlay({
  className,
  opacity = 0.055,
  fixed = false,
}: NoiseOverlayProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'noise-overlay pointer-events-none z-[2]',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className,
      )}
      style={{ opacity }}
    />
  )
}
