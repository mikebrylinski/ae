import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { Container } from '@/components/ui/Container'
import { GlassCard } from '@/components/ui/GlassCard'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const PARTICLES = [
  { left: '8%', top: '18%', delay: '0s', dur: '9s' },
  { left: '16%', top: '42%', delay: '1.2s', dur: '11s' },
  { left: '28%', top: '12%', delay: '2.4s', dur: '8s' },
  { left: '37%', top: '31%', delay: '0.6s', dur: '12s' },
  { left: '48%', top: '9%', delay: '3.1s', dur: '10s' },
  { left: '61%', top: '22%', delay: '1.8s', dur: '9.5s' },
  { left: '72%', top: '14%', delay: '0.4s', dur: '11.5s' },
  { left: '81%', top: '36%', delay: '2.8s', dur: '8.5s' },
  { left: '89%', top: '20%', delay: '1.5s', dur: '10.5s' },
  { left: '93%', top: '48%', delay: '3.6s', dur: '9s' },
  { left: '54%', top: '40%', delay: '2.1s', dur: '13s' },
  { left: '22%', top: '55%', delay: '0.9s', dur: '10s' },
] as const

interface BerlinSkylineProps {
  heading?: string
  subheading?: string
}

export function BerlinSkyline({ heading, subheading }: BerlinSkylineProps) {
  const reduced = useReducedMotion()
  const isHeader = Boolean(heading)

  return (
    <section
      className={cn(
        'berlin-skyline relative overflow-hidden border-b border-white/10',
        isHeader ? 'berlin-skyline--header' : 'mt-16 border-t',
        reduced && 'berlin-skyline--static',
      )}
      aria-label={heading ?? 'Berlin, Germany — Charlottenburg'}
    >
      <div className="berlin-skyline__frame">
        <img
          src="/images/about/berlin.jpg"
          alt="Berlin at night, Fernsehturm over the skyline"
          width={2400}
          height={1310}
          className="berlin-skyline__photo"
        />

        <div className="berlin-skyline__shade" aria-hidden />
        <div className="berlin-skyline__scan" aria-hidden />
        <div className="berlin-skyline__sweep" aria-hidden />
        <div className="berlin-skyline__beacon" aria-hidden />
        <div className="berlin-skyline__shaft" aria-hidden />

        <div className="berlin-skyline__particles" aria-hidden>
          {PARTICLES.map((p) => (
            <span
              key={`${p.left}-${p.top}`}
              className="berlin-skyline__particle"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
        </div>

        <NoiseOverlay opacity={0.045} />
      </div>

      <Container className="relative z-10 w-full min-w-0 py-4 sm:py-5 md:py-6 lg:py-7">
        {isHeader ? (
          <GlassCard className="mx-auto w-full min-w-0 max-w-full px-4 py-5 text-center sm:w-max sm:px-8 sm:py-6 md:px-10 md:py-7">
            <h1 className="font-heading min-w-0 text-[clamp(1.05rem,4.8vw,2.15rem)] leading-[1.25] tracking-[0.06em] break-words text-white sm:tracking-[0.08em]">
              <span className="block">{heading}</span>
              {subheading ? (
                <span className="mt-1.5 block text-primary">{subheading}</span>
              ) : null}
            </h1>
          </GlassCard>
        ) : (
          <div className="flex flex-col items-start gap-2 md:max-w-md">
            <p className="font-heading text-[0.65rem] tracking-[0.28em] text-primary">
              Origins
            </p>
            <h2 className="font-heading text-3xl tracking-[0.14em] text-white sm:text-4xl">
              Berlin
            </h2>
            <p className="font-heading text-[0.65rem] tracking-[0.22em] text-white/70">
              Charlottenburg · 52°31′N
            </p>
          </div>
        )}
      </Container>
    </section>
  )
}
