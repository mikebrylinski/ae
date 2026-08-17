import { cn } from '@/lib/utils'

interface VuPlateProps {
  children: string
  className?: string
}

/** Rack faceplate chip for section titles. */
export function VuPlate({ children, className }: VuPlateProps) {
  return (
    <span className={cn('vu-plate', className)}>
      <span className="vu-plate__mark vu-plate__mark--bl" aria-hidden />
      <span className="vu-plate__mark vu-plate__mark--br" aria-hidden />
      <span className="vu-pair__plate vu-plate__face">
        <span className="vu-pair__plate-name">{children}</span>
      </span>
    </span>
  )
}
