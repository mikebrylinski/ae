import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('glass-card', className)} {...props} />
  ),
)
GlassCard.displayName = 'GlassCard'

export function GlassIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('glass-icon', className)} {...props} />
}
