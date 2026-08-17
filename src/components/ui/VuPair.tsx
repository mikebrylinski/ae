import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

const SCALE = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3]
const SEGS = 16

function VuFace({ angle, label }: { angle: number; label: string }) {
  const uid = useId().replace(/:/g, '')

  return (
    <div className="vu-meter">
      <div className="vu-meter__face">
        <svg viewBox="0 0 200 130" className="vu-meter__svg" aria-hidden>
          <defs>
            <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#161616" />
              <stop offset="100%" stopColor="#080808" />
            </linearGradient>
            <linearGradient id={`${uid}-arc`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5a5a5a" />
              <stop offset="72%" stopColor="#b8ff00" />
              <stop offset="100%" stopColor="#ff4d4d" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="192" height="122" rx="14" fill={`url(#${uid}-glass)`} />
          <path
            d="M22 98 A78 78 0 0 1 178 98"
            fill="none"
            stroke={`url(#${uid}-arc)`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {SCALE.map((n) => {
            const t = (n + 20) / 23
            const a = Math.PI * (1.12 - t * 0.84)
            const x1 = 100 + Math.cos(a) * 68
            const y1 = 108 + Math.sin(a) * -68
            const x2 = 100 + Math.cos(a) * (n >= 0 ? 76 : 74)
            const y2 = 108 + Math.sin(a) * (n >= 0 ? -76 : -74)
            const lx = 100 + Math.cos(a) * 86
            const ly = 108 + Math.sin(a) * -86
            const hot = n >= 0
            return (
              <g key={n}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={hot ? '#ff5a5a' : '#8a8a8a'}
                  strokeWidth={n === 0 || n === 3 || n === -20 ? 1.5 : 0.9}
                  strokeLinecap="round"
                />
                {(n === -20 || n === -10 || n === -5 || n === 0 || n === 3) && (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    fill={hot ? '#ff7a7a' : '#a3a3a3'}
                    fontSize="7.5"
                    fontFamily="Inter, sans-serif"
                  >
                    {n}
                  </text>
                )}
              </g>
            )
          })}
          <g
            className="vu-meter__needle"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '100px 108px',
            }}
          >
            <line
              x1="100"
              y1="108"
              x2="100"
              y2="32"
              stroke="#b8ff00"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
          <circle cx="100" cy="108" r="4.5" fill="#b8ff00" />
          <circle cx="100" cy="108" r="2" fill="#111" />
          <text
            x="100"
            y="58"
            textAnchor="middle"
            fill="#b8ff00"
            fontSize="9"
            fontFamily="Space Grotesk, sans-serif"
            fontWeight="700"
            letterSpacing="1.6"
          >
            VU
          </text>
        </svg>
      </div>
      <p className="vu-meter__label">{label}</p>
    </div>
  )
}

function DigiVu({ level, label }: { level: number; label: string }) {
  const lit = Math.round(clamp(level, 0, 1) * SEGS)
  const db = -20 + clamp(level, 0, 1) * 23

  return (
    <div className="vu-digi">
      <p className="vu-digi__db">
        {db >= 0 ? '+' : ''}
        {db.toFixed(1)}
      </p>
      <div className="vu-digi__track" aria-hidden>
        <span className="vu-digi__fill" style={{ height: `${clamp(level, 0, 1) * 100}%` }} />
        {Array.from({ length: SEGS }, (_, i) => {
          const idx = SEGS - 1 - i
          const on = idx < lit
          const clip = idx >= 14
          const warn = idx >= 11 && idx < 14
          return (
            <span
              key={idx}
              className={cn(
                'vu-digi__seg',
                on && 'vu-digi__seg--on',
                warn && 'vu-digi__seg--warn',
                clip && 'vu-digi__seg--clip',
              )}
            />
          )
        })}
      </div>
      <p className="vu-digi__label">{label}</p>
    </div>
  )
}

function SubmixMix({ level, label }: { level: number; label: string }) {
  const peak = level > 0.84

  return (
    <div className="vu-submix__feed">
      <span className={cn('vu-submix__peak', peak && 'vu-submix__peak--on')} />
      <div className="vu-submix__meter" aria-hidden>
        <span
          className="vu-submix__fill"
          style={{ height: `${clamp(level, 0, 1) * 100}%` }}
        />
      </div>
      <p className="vu-submix__label">{label}</p>
    </div>
  )
}

function Submix({ mixes }: { mixes: number[] }) {
  return (
    <div className="vu-submix" aria-hidden>
      <p className="vu-pair__plate">
        <span className="vu-pair__plate-vu">IN</span>
        <span className="vu-pair__plate-name">Submix</span>
      </p>
      <div className="vu-submix__feeds">
        {mixes.map((level, i) => (
          <SubmixMix key={i} level={level} label={`M${i + 1}`} />
        ))}
      </div>
      <p className="vu-pair__plate">
        <span className="vu-pair__plate-vu">4</span>
        <span className="vu-pair__plate-name">Mixes</span>
      </p>
    </div>
  )
}

export function VuPair() {
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const reduced = useReducedMotion()
  const [feeds, setFeeds] = useState([0.22, 0.28, 0.18, 0.24])
  const [levelL, setLevelL] = useState(0.22)
  const [levelR, setLevelR] = useState(0.24)

  useEffect(() => {
    if (!inView) return

    const speed = 1 / 6
    let frame = 0
    let t = 0
    const walks = [0.38, 0.46, 0.32, 0.52]
    const curs = [0.2, 0.26, 0.16, 0.22]
    let curL = 0.2
    let curR = 0.22
    let last = performance.now()
    const f1 = [9.1, 8.4, 7.6, 10.2]
    const f2 = [16.4, 15.2, 14.1, 17.3]
    const off = [0, 0.7, 1.3, 2.1]

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt * speed

      for (let i = 0; i < 4; i += 1) {
        walks[i] += (Math.random() - 0.5) * 1.9 * dt * 12 * speed
        walks[i] = clamp(walks[i], 0.05, 0.98)
        if (Math.random() < 0.12 * speed) walks[i] = Math.random()
        if (Math.random() < 0.04 * speed) walks[i] = 0.08 + Math.random() * 0.2
      }

      const sigs = walks.map((walk, i) =>
        clamp(
          walk * 0.7 +
            0.18 * Math.abs(Math.sin(t * f1[i] + off[i])) +
            0.12 * Math.abs(Math.sin(t * f2[i] + off[i] * 1.4)) +
            (Math.random() - 0.5) * 0.16 * speed,
          0,
          1,
        ),
      )

      const follow = (reduced ? 0.45 : 0.72) * speed
      const step = clamp(follow * (dt * 60), 0.04, 0.95)
      for (let i = 0; i < 4; i += 1) {
        curs[i] += (sigs[i] - curs[i]) * step
      }

      const mixL = clamp(curs[0] * 0.4 + curs[1] * 0.16 + curs[2] * 0.32 + curs[3] * 0.12, 0, 1)
      const mixR = clamp(curs[0] * 0.12 + curs[1] * 0.4 + curs[2] * 0.16 + curs[3] * 0.32, 0, 1)
      curL += (mixL - curL) * step
      curR += (mixR - curR) * step

      setFeeds([curs[0], curs[1], curs[2], curs[3]])
      setLevelL(curL)
      setLevelR(curR)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced])

  return (
    <div ref={rootRef} className="vu-rack">
      <Submix mixes={feeds} />
      <div
        className="vu-pair"
        role="img"
        aria-label="Main stereo out analog and digital VU meters"
      >
        <p className="vu-pair__plate">
          <span className="vu-pair__plate-vu">VU</span>
          <span className="vu-pair__plate-name">Main Stereo Out</span>
        </p>
        <div className="vu-pair__row">
          <VuFace angle={-48 + levelL * 92} label="L" />
          <VuFace angle={-48 + levelR * 92} label="R" />
          <div className="vu-digi-bank">
            <DigiVu level={levelL} label="L" />
            <DigiVu level={levelR} label="R" />
          </div>
        </div>
        <p className="vu-pair__plate">
          <span className="vu-pair__plate-vu">WWW</span>
          <span className="vu-pair__plate-name vu-pair__plate-name--url">andyebert.com</span>
        </p>
      </div>
    </div>
  )
}
