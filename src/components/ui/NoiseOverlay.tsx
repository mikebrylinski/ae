import { cn } from '@/lib/utils'

interface NoiseOverlayProps {
  className?: string
  /** 0–1 opacity of the grit layer. Default is arena-subtle. */
  opacity?: number
  /** When true, covers the viewport and stays fixed (global film grain). */
  fixed?: boolean
}

/**
 * Subtle SVG fractal-noise grit for arena / rock-show atmosphere.
 * Pointer-events none — never blocks interaction or text selection.
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
        'pointer-events-none z-[2] mix-blend-overlay',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className,
      )}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
      }}
    />
  )
}
