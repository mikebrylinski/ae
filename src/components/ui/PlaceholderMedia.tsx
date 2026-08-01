import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface PlaceholderMediaProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
  aspect?: string
}

export function PlaceholderMedia({
  label = 'Photo coming soon',
  aspect = 'aspect-video',
  className,
  style,
  children,
  ...props
}: PlaceholderMediaProps) {
  return (
    <div
      className={cn(
        'placeholder-media relative flex items-center justify-center overflow-hidden border border-border',
        aspect,
        className,
      )}
      style={style}
      {...props}
    >
      {children}
      {!children ? (
        <span className="pointer-events-none select-none px-4 text-center font-heading text-[10px] tracking-[0.18em] text-muted uppercase">
          {label}
        </span>
      ) : null}
    </div>
  )
}
