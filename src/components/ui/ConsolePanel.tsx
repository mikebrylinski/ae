import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useInView } from '@/hooks/useInView'

interface ChannelSpec {
  rest: number
  motion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  knobAngle?: number
}

interface ConsolePanelProps {
  className?: string
  /** Overall panel opacity. */
  opacity?: number
  /** Shorter tracks / tighter bank for CTA overlay use. */
  compact?: boolean
}

const CHANNELS: ChannelSpec[] = [
  { rest: 42, motion: 1, knobAngle: -30 },
  { rest: 68, motion: 2, knobAngle: 15 },
  { rest: 28, motion: 3, knobAngle: -50 },
  { rest: 55, motion: 4, knobAngle: 40 },
  { rest: 75, motion: 5, knobAngle: -10 },
  { rest: 35, motion: 6, knobAngle: 55 },
  { rest: 60, motion: 7, knobAngle: -25 },
  { rest: 48, motion: 8, knobAngle: 20 },
]

/**
 * Mixing-console panel — vertical faders ride independently.
 * Static under prefers-reduced-motion; pauses when off-screen.
 */
export function ConsolePanel({
  className,
  opacity = 0.82,
  compact = false,
}: ConsolePanelProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const animate = !reduced && inView

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-animate={animate ? 'true' : 'false'}
      className={cn(
        'console-panel pointer-events-none relative mx-auto flex h-full w-full max-w-[22rem] items-center justify-center sm:max-w-[26rem]',
        compact && 'console-panel--compact max-w-[18rem] sm:max-w-[20rem]',
        className,
      )}
      style={{ opacity }}
    >
      <div className="console-panel__bank">
        {CHANNELS.map((ch, i) => (
          <div key={i} className="console-panel__channel">
            <div
              className="console-panel__knob"
              style={{
                ['--knob-rest' as string]: `${ch.knobAngle ?? 0}deg`,
              }}
            >
              <span className="console-panel__knob-pointer" />
            </div>

            <div className="console-panel__track">
              <span className="console-panel__rail" />
              <span
                className={cn(
                  'console-panel__cap',
                  `console-panel__cap--m${ch.motion}`,
                )}
                style={{
                  ['--fader-rest' as string]: `${ch.rest}%`,
                }}
              />
            </div>

            <span className="console-panel__slot" />
          </div>
        ))}
      </div>
    </div>
  )
}
