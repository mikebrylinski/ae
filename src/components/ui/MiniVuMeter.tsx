import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Compact decorative VU meter for pull quotes and inline accents. */
export function MiniVuMeter({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')

  return (
    <div
      className={cn('mini-vu', className)}
      aria-hidden
    >
      <svg viewBox="0 0 72 48" className="mini-vu__svg">
        <defs>
          <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="70"
          height="46"
          rx="3"
          fill={`url(#${uid}-face)`}
          stroke="rgba(184,255,0,0.28)"
          strokeWidth="1"
        />
        {[-20, -10, -5, 0, 3].map((n) => {
          const t = (n + 20) / 23
          const a = Math.PI * (1.12 - t * 0.84)
          const x1 = 36 + Math.cos(a) * 22
          const y1 = 40 + Math.sin(a) * -22
          const x2 = 36 + Math.cos(a) * (n >= 0 ? 26 : 25)
          const y2 = 40 + Math.sin(a) * (n >= 0 ? -26 : -25)
          return (
            <line
              key={n}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={n >= 0 ? '#ff5a5a' : '#6e6e6e'}
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
        <g className="mini-vu__needle">
          <line
            x1="36"
            y1="40"
            x2="36"
            y2="16"
            stroke="#b8ff00"
            strokeWidth="1.25"
            strokeLinecap="butt"
          />
        </g>
        <circle cx="36" cy="40" r="2.2" fill="#b8ff00" />
        <circle cx="36" cy="40" r="1" fill="#111" />
        <text
          x="36"
          y="12"
          textAnchor="middle"
          fill="#b8ff00"
          fontSize="5.5"
          fontFamily="var(--font-heading), sans-serif"
          letterSpacing="0.12em"
        >
          VU
        </text>
      </svg>
    </div>
  )
}
