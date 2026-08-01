import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { ConsolePanel } from '@/components/ui/ConsolePanel'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function Hero() {
  const { hero } = site
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLImageElement>(null)

  const eyebrow = hero.subheadline.filter(Boolean).join(' • ')

  useEffect(() => {
    if (reduced || !contentRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      if (eyebrow) {
        tl.from('[data-hero="eyebrow"]', { opacity: 0, y: 10, duration: 1.15 })
      }
      tl.from('[data-hero="headline"]', { opacity: 0, y: 18, duration: 1.35 }, eyebrow ? '-=0.65' : undefined)
        .from('[data-hero="body"]', { opacity: 0, y: 10, duration: 1.05 }, '-=0.75')
        .from('[data-hero="cta"]', { opacity: 0, y: 8, duration: 1 }, '-=0.65')
        .from('[data-hero="console"]', { opacity: 0, y: 12, duration: 1.25 }, '-=0.8')

      // Very subtle bg drift — restrained parallax feel
      if (bgRef.current) {
        gsap.to(bgRef.current, {
          yPercent: 2.5,
          scale: 1.04,
          duration: 18,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })
      }
    }, rootRef)

    return () => ctx.revert()
  }, [reduced, eyebrow])

  const accent = hero.headlineAccent ?? 'PERFECTION.'
  const headlineParts = hero.headline.split(accent)

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
      aria-label="Hero"
    >
      <div className="absolute inset-0">
        <img
          ref={bgRef}
          src={hero.backgroundImage}
          alt=""
          className="h-full w-full object-cover object-[70%_center] will-change-transform md:object-[75%_center]"
          fetchPriority="high"
        />
        <div className="hero-overlay absolute inset-0" aria-hidden />
        <NoiseOverlay opacity={0.07} className="z-[1]" />
      </div>

      <Container className="relative z-10 py-28 md:py-32">
        <div
          ref={contentRef}
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16"
        >
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            {eyebrow ? (
              <p
                data-hero="eyebrow"
                className="font-heading mb-5 text-[11px] tracking-[0.22em] text-primary sm:text-xs"
              >
                {eyebrow}
              </p>
            ) : null}

            <h1
              data-hero="headline"
              className="font-heading text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.95] tracking-[0.04em] text-white"
            >
              {headlineParts[0]}
              <span className="text-primary">{accent}</span>
              {headlineParts[1] ?? ''}
            </h1>

            <p
              data-hero="body"
              className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0"
            >
              {hero.body}
            </p>

            <div
              data-hero="cta"
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link
                to={hero.ctaPrimary.href}
                className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
              >
                {hero.ctaPrimary.label}
              </Link>
              <Link
                to={hero.ctaSecondary.href}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              >
                {hero.ctaSecondary.label}
              </Link>
            </div>
          </div>

          {/* Desktop only — no stacked console on mobile */}
          <div
            data-hero="console"
            className="hidden min-h-[26rem] items-center justify-center lg:flex"
          >
            <ConsolePanel />
          </div>
        </div>
      </Container>
    </section>
  )
}
