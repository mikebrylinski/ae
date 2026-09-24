import { cn } from '@/lib/utils'
import {
  BERLIN_MAP_BERLIN,
  BERLIN_MAP_GRATICULE,
  BERLIN_MAP_NEIGHBORS,
  BERLIN_MAP_STATES,
  BERLIN_MAP_VIEWBOX,
  BERLIN_PIN,
} from '@/components/ui/berlinMapGeometry'

const CITIES = [
  { name: 'Hamburg', x: 403.9, y: 137.2 },
  { name: 'Cologne', x: 272.4, y: 318 },
  { name: 'Frankfurt', x: 347, y: 375.5 },
  { name: 'Munich', x: 472.9, y: 512 },
]

/**
 * Locator map that slowly zooms from Germany into West Berlin.
 * Used as a wrap media tile on the About page.
 */
export function BerlinMapAnimation({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'berlin-map relative aspect-[4/3] w-full overflow-hidden bg-[#070b09]',
        className,
      )}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox={BERLIN_MAP_VIEWBOX}
        className="berlin-map__svg absolute inset-0 h-full w-full"
        aria-hidden
      >
        <rect width="800" height="600" fill="#070b09" />
        <g className="berlin-map__scene">
          <g
            className="berlin-map__graticule"
            fill="none"
            stroke="rgba(184,255,0,0.09)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          >
            {BERLIN_MAP_GRATICULE.map((d, i) => (
              <path key={`g${i}`} d={d} />
            ))}
          </g>

          <g
            className="berlin-map__neighbors"
            fill="#121814"
            stroke="rgba(184,255,0,0.28)"
            strokeWidth="1"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {BERLIN_MAP_NEIGHBORS.map((d, i) => (
              <path key={`n${i}`} d={d} />
            ))}
          </g>

          <g
            className="berlin-map__states"
            fill="#1c2618"
            stroke="rgba(184,255,0,0.7)"
            strokeWidth="1.15"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {BERLIN_MAP_STATES.map((d, i) => (
              <path key={`s${i}`} d={d} />
            ))}
          </g>

          <g
            className="berlin-map__berlin"
            fill="rgba(184,255,0,0.2)"
            stroke="#b8ff00"
            strokeWidth="1.4"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {BERLIN_MAP_BERLIN.map((d) => (
              <path key="berlin" d={d} />
            ))}
          </g>

          {CITIES.map((city) => (
            <circle key={city.name} cx={city.x} cy={city.y} r="2.4" fill="rgba(184,255,0,0.7)" />
          ))}

          <text
            className="berlin-map__country"
            x="378"
            y="298"
            textAnchor="middle"
            fill="rgba(184,255,0,0.78)"
            fontFamily="var(--font-heading, ui-sans-serif, system-ui)"
            fontSize="22"
            letterSpacing="0.22em"
          >
            GERMANY
          </text>

          <g className="berlin-map__pin" transform={`translate(${BERLIN_PIN.x} ${BERLIN_PIN.y})`}>
            <circle className="berlin-map__pulse" r="16" fill="rgba(184,255,0,0.14)" />
            <circle
              className="berlin-map__pulse berlin-map__pulse--delayed"
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
