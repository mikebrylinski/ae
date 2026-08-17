import { cn } from '@/lib/utils'

interface LoadingLineProps {
  className?: string
  /** Hide from assistive tech when a labeled meter is also on screen. */
  decorative?: boolean
}

/** Thin signal line across the top of the viewport while a route loads. */
export function LoadingLine({ className, decorative = false }: LoadingLineProps) {
  return (
    <div
      className={cn('load-line', className)}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'status', 'aria-live': 'polite', 'aria-label': 'Loading' })}
    >
      <span className="load-line__fill" />
    </div>
  )
}

interface LoadingMeterProps {
  className?: string
  label?: string
}

/** Compact LED meter for in-page loading states. */
export function LoadingMeter({
  className,
  label = 'Loading',
}: LoadingMeterProps) {
  return (
    <div
      className={cn('load-meter', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <p className="load-meter__label">{label}</p>
      <div className="load-meter__track" aria-hidden>
        <span className="load-meter__fill" />
        <span className="load-meter__ticks" />
      </div>
      <p className="load-meter__sub">Signal</p>
    </div>
  )
}
