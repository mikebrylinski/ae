import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { Container } from '@/components/ui/Container'
import { GlassCard } from '@/components/ui/GlassCard'

interface PhotoHeaderProps {
  src: string
  alt: string
  heading: string
  subheading?: string
}

export function PhotoHeader({ src, alt, heading, subheading }: PhotoHeaderProps) {
  return (
    <section
      className="berlin-skyline berlin-skyline--header relative overflow-hidden border-b border-white/10"
      aria-label={heading}
    >
      <div className="berlin-skyline__frame">
        <img
          src={src}
          alt={alt}
          className="berlin-skyline__photo"
        />
        <div className="berlin-skyline__shade" aria-hidden />
        <NoiseOverlay opacity={0.045} />
      </div>

      <Container className="relative z-10 w-full min-w-0 py-4 sm:py-5 md:py-6 lg:py-7">
        <GlassCard className="mx-auto w-full min-w-0 max-w-full px-4 py-5 text-center sm:w-max sm:px-8 sm:py-6 md:px-10 md:py-7">
          <h1 className="font-heading min-w-0 text-[clamp(1.05rem,4.8vw,2.15rem)] leading-[1.25] tracking-[0.06em] break-words text-white sm:tracking-[0.08em]">
            <span className="block">{heading}</span>
            {subheading ? (
              <span className="mt-1.5 block text-primary">{subheading}</span>
            ) : null}
          </h1>
        </GlassCard>
      </Container>
    </section>
  )
}
