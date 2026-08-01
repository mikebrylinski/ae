import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

interface MeshBackdropProps {
  className?: string
  /** Noise grit opacity. Footer default is subtle. */
  noiseOpacity?: number
}

/**
 * Diagonal wire mesh + soft lime glow blooms.
 * Pointer-events none — stays behind content.
 */
export function MeshBackdrop({
  className,
  noiseOpacity = 0.025,
}: MeshBackdropProps) {
  const reduced = useReducedMotion()

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div className="mesh-base absolute inset-0" />
      <div
        className={cn(
          'mesh-glow absolute inset-0',
          reduced && 'mesh-glow--static',
        )}
      />
      <div className="mesh-lattice absolute inset-0" />
      <NoiseOverlay opacity={noiseOpacity} />
    </div>
  )
}
