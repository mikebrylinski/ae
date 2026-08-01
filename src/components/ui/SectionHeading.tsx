import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  title: string
  titleClassName?: string
  align?: 'left' | 'center'
  action?: ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  titleClassName,
  align = 'center',
  action,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 md:mb-14',
        // Center on mobile; honor left align from md up when requested
        align === 'center' ? 'text-center' : 'text-center md:text-left',
        action &&
          'flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
      {...props}
    >
      <div className={align === 'center' && !action ? 'mx-auto' : undefined}>
        {eyebrow ? (
          <p className="mb-3 font-heading text-xs tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            'font-heading text-3xl tracking-[0.08em] text-foreground sm:text-4xl md:text-5xl',
            titleClassName,
          )}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}
