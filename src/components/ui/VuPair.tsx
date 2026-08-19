import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { isSafariBrowser } from '@/lib/safari'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

const SCALE = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3]
const SEGS = 16
const GR_SEGS = 18

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
          </defs>
          <rect x="4" y="4" width="192" height="122" rx="14" fill={`url(#${uid}-glass)`} />
          {SCALE.map((n) => {
            const t = (n + 20) / 23
            const a = Math.PI * (1.12 - t * 0.84)
            const x1 = 100 + Math.cos(a) * 68
            const y1 = 108 + Math.sin(a) * -68
            const x2 = 100 + Math.cos(a) * (n >= 0 ? 76 : 74)
            const y2 = 108 + Math.sin(a) * (n >= 0 ? -76 : -74)
            const lx = 100 + Math.cos(a) * 84
            const ly = 108 + Math.sin(a) * -84
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
                    fontSize="11"
                    fontFamily="Inter, sans-serif"
                    fontWeight="600"
                  >
                    {n}
                  </text>
                )}
              </g>
            )
          })}
          <g
            className="vu-meter__needle"
            transform={`rotate(${angle} 100 108)`}
          >
            <line
              x1="100"
              y1="108"
              x2="100"
              y2="38"
              stroke="#b8ff00"
              strokeWidth="1.5"
              strokeLinecap="butt"
            />
          </g>
          <circle cx="100" cy="108" r="4.5" fill="#b8ff00" />
          <circle cx="100" cy="108" r="2" fill="#111" />
        </svg>
      </div>
      <p className="vu-meter__label">{label}</p>
    </div>
  )
}

function GainReduction({
  amount,
  label,
  showScale = false,
}: {
  amount: number
  label: string
  showScale?: boolean
}) {
  const lit = Math.round(clamp(amount, 0, 1) * GR_SEGS)
  const db = clamp(amount, 0, 1) * 20

  return (
    <div className="vu-gr">
      <p className="vu-gr__label">{label}</p>
      <p className="vu-gr__db">-{db.toFixed(0)}</p>
      <div className="vu-gr__meter">
        <div className="vu-gr__track" aria-hidden>
          <span className="vu-gr__fill" style={{ width: `${clamp(amount, 0, 1) * 100}%` }} />
          {Array.from({ length: GR_SEGS }, (_, i) => {
            const on = i < lit
            const clip = i >= 15
            const warn = i >= 11 && i < 15
            return (
              <span
                key={i}
                className={cn(
                  'vu-gr__seg',
                  on && 'vu-gr__seg--on',
                  warn && 'vu-gr__seg--warn',
                  clip && 'vu-gr__seg--clip',
                )}
              />
            )
          })}
        </div>
        {showScale ? (
          <div className="vu-gr__scale" aria-hidden>
            <span>-20</span>
            <span>-10</span>
            <span>0</span>
          </div>
        ) : null}
      </div>
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

function SubmixChannel({ level }: { level: number }) {
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
    </div>
  )
}

function SubmixMix({
  left,
  right,
  label,
}: {
  left: number
  right: number
  label: string
}) {
  return (
    <div className="vu-submix__mix">
      <div className="vu-submix__pair">
        <SubmixChannel level={left} />
        <SubmixChannel level={right} />
      </div>
      <p className="vu-submix__label">{label}</p>
    </div>
  )
}

function Submix({ mixes }: { mixes: [number, number][] }) {
  return (
    <div className="vu-submix" aria-hidden>
      <p className="vu-pair__plate">
        <span className="vu-pair__plate-vu">IN</span>
        <span className="vu-pair__plate-name">Submix</span>
      </p>
      <div className="vu-submix__feeds">
        {mixes.map(([left, right], i) => (
          <SubmixMix key={i} left={left} right={right} label={`M${i + 1}`} />
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
  const [feeds, setFeeds] = useState<[number, number][]>([
    [0.22, 0.22],
    [0.28, 0.28],
    [0.18, 0.18],
    [0.24, 0.24],
  ])
  const [levelL, setLevelL] = useState(0.22)
  const [levelR, setLevelR] = useState(0.24)
  const [digiL, setDigiL] = useState(0.26)
  const [digiR, setDigiR] = useState(0.3)
  const [grL, setGrL] = useState(0.08)
  const [grR, setGrR] = useState(0.1)

  useEffect(() => {
    if (!inView) return

    const safari = isSafariBrowser()
    const paintEvery = safari ? 70 : 0
    const speed = 1 / 6
    let frame = 0
    let t = 0
    const walks = [0.38, 0.46, 0.32, 0.52]
    const curs = [0.2, 0.26, 0.16, 0.22]
    let curL = 0.2
    let curR = 0.22
    let curDigiL = 0.26
    let curDigiR = 0.3
    let curGrL = 0.08
    let curGrR = 0.1
    let last = performance.now()
    let lastPaint = 0
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

      const mixL = clamp(curs[0] * 0.48 + curs[1] * 0.1 + curs[2] * 0.3 + curs[3] * 0.08, 0, 1)
      const mixR = clamp(curs[0] * 0.08 + curs[1] * 0.48 + curs[2] * 0.1 + curs[3] * 0.3, 0, 1)
      curL += (mixL - curL) * step
      curR += (mixR - curR) * step

      const peakL = clamp(mixL * 0.82 + sigs[0] * 0.18, 0, 1)
      const peakR = clamp(mixR * 0.82 + sigs[1] * 0.18, 0, 1)
      const digiUp = clamp(step * 2.6, 0.08, 0.98)
      const digiDown = clamp(step * 0.7, 0.05, 0.9)
      curDigiL += (peakL - curDigiL) * (peakL > curDigiL ? digiUp : digiDown)
      curDigiR += (peakR - curDigiR) * (peakR > curDigiR ? digiUp : digiDown)

      const targetGrL = clamp((mixL - 0.48) / 0.42, 0, 1)
      const targetGrR = clamp((mixR - 0.48) / 0.42, 0, 1)
      const grStepL = targetGrL > curGrL ? step * 2.1 : step * 0.28
      const grStepR = targetGrR > curGrR ? step * 2.1 : step * 0.28
      curGrL += (targetGrL - curGrL) * clamp(grStepL, 0.03, 0.95)
      curGrR += (targetGrR - curGrR) * clamp(grStepR, 0.03, 0.95)

      if (!paintEvery || now - lastPaint >= paintEvery) {
        lastPaint = now
        setFeeds([
          [curs[0], curs[0]],
          [curs[1], curs[1]],
          [curs[2], curs[2]],
          [curs[3], curs[3]],
        ])
        setLevelL(curL)
        setLevelR(curR)
        setDigiL(curDigiL)
        setDigiR(curDigiR)
        setGrL(curGrL)
        setGrR(curGrR)
      }
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
        aria-label="Main stereo out analog VU, gain reduction, and digital meters"
      >
        <p className="vu-pair__plate">
          <span className="vu-pair__plate-name">Main Stereo Out</span>
        </p>
        <div className="vu-pair__row">
          <div className="vu-pair__analog">
            <div className="vu-gr-bank">
              <GainReduction amount={grL} label="L" />
              <GainReduction amount={grR} label="R" showScale />
            </div>
            <div className="vu-pair__faces">
              <VuFace angle={-48 + levelL * 92} label="Left" />
              <VuFace angle={-48 + levelR * 92} label="Right" />
            </div>
          </div>
          <div className="vu-digi-bank">
            <DigiVu level={digiL} label="L" />
            <DigiVu level={digiR} label="R" />
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
