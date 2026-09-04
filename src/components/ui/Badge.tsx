import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center font-heading text-[11px] leading-none tracking-[0.12em] uppercase border px-2.5 pt-1 pb-[3px]',
  {
    variants: {
      variant: {
        default: 'border-primary text-primary bg-transparent',
        muted: 'border-border text-muted bg-transparent',
        solid: 'border-primary bg-primary text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
