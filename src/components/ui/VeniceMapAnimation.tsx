import { cn } from '@/lib/utils'
import {
  VENICE_MAP_CITIES,
  VENICE_MAP_FLORIDA,
  VENICE_MAP_GRATICULE,
  VENICE_MAP_LABEL,
  VENICE_MAP_NEIGHBORS,
  VENICE_MAP_VIEWBOX,
  VENICE_PIN,
} from '@/components/ui/veniceMapGeometry'

/**
 * Locator map that slowly zooms from Florida into Venice, FL.
 * Used in the Venice section on the About page.
 */
export function VeniceMapAnimation({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'venice-map-anim relative aspect-[4/3] h-full w-full overflow-hidden bg-[#070b09]',
        className,
      )}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox={VENICE_MAP_VIEWBOX}
        className="venice-map-anim__svg absolute inset-0 h-full w-full"
        aria-hidden
      >
        <rect width="800" height="600" fill="#070b09" />
        <g className="venice-map-anim__scene">
          <g
            className="venice-map-anim__graticule"
            fill="none"
            stroke="rgba(184,255,0,0.09)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          >
            {VENICE_MAP_GRATICULE.map((d, i) => (
              <path key={`g${i}`} d={d} />
            ))}
          </g>

          <g
            className="venice-map-anim__neighbors"
            fill="#121814"
            stroke="rgba(184,255,0,0.28)"
            strokeWidth="1"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {VENICE_MAP_NEIGHBORS.map((d, i) => (
              <path key={`n${i}`} d={d} />
            ))}
          </g>

          <g
            className="venice-map-anim__florida"
            fill="#1c2618"
            stroke="rgba(184,255,0,0.7)"
            strokeWidth="1.15"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {VENICE_MAP_FLORIDA.map((d, i) => (
              <path key={`f${i}`} d={d} />
            ))}
          </g>

          {VENICE_MAP_CITIES.map((city) => (
            <circle key={city.name} cx={city.x} cy={city.y} r="2.4" fill="rgba(184,255,0,0.7)" />
          ))}

          <text
            className="venice-map-anim__state"
            x={VENICE_MAP_LABEL.x}
            y={VENICE_MAP_LABEL.y}
            textAnchor="middle"
            fill="rgba(184,255,0,0.78)"
            fontFamily="var(--font-heading, ui-sans-serif, system-ui)"
            fontSize="22"
            letterSpacing="0.22em"
          >
            FLORIDA
          </text>

          <g className="venice-map-anim__pin" transform={`translate(${VENICE_PIN.x} ${VENICE_PIN.y})`}>
            <circle className="venice-map-anim__pulse" r="16" fill="rgba(184,255,0,0.14)" />
            <circle
              className="venice-map-anim__pulse venice-map-anim__pulse--delayed"
              r="10"
              fill="rgba(184,255,0,0.18)"
            />
            <circle r="4.2" fill="#b8ff00" />
            <circle r="1.6" fill="#0a0a0a" />
          </g>
        </g>
      </svg>
    </div>
  )
}
