import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 xl:px-14', className)}
      {...props}
    />
  )
}
