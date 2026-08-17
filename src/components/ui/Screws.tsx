import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type Drive = 'slot' | 'phillips'

interface RackScrewProps {
  drive?: Drive
  angle?: number
  className?: string
}

export function RackScrew({
  drive = 'slot',
  angle = -28,
  className,
}: RackScrewProps) {
  return (
    <span
      className={cn(
        'rack-screw',
        drive === 'phillips' && 'rack-screw--phillips',
        className,
      )}
      style={{ '--slot': `${angle}deg` } as CSSProperties}
    />
  )
}
