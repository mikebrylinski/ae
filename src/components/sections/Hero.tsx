import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Mail } from 'lucide-react'
import gsap from 'gsap'
import { getSite } from '@/lib/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { VuPlate } from '@/components/ui/VuPlate'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function Hero() {
  const { lang, t } = useLanguage()
  const { hero } = getSite(lang)
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLImageElement>(null)

  const eyebrow = hero.subheadline.filter(Boolean).join(' • ')

  useEffect(() => {
    if (reduced || !contentRef.current || document.documentElement.classList.contains('is-safari')) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      if (eyebrow) {
        tl.from('[data-hero="eyebrow"]', { opacity: 0, y: 10, duration: 1.15 })
      }
      tl.from('[data-hero="headline"]', { opacity: 0, y: 18, duration: 1.35 }, eyebrow ? '-=0.65' : undefined)
        .from('[data-hero="body"]', { opacity: 0, y: 10, duration: 1.05 }, '-=0.75')
        .from('[data-hero="cta"]', { opacity: 0, y: 8, duration: 1 }, '-=0.65')

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
  const canSplit = hero.headline.includes(accent)
  const headlineParts = canSplit ? hero.headline.split(accent) : [hero.headline]

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[calc(100svh-7rem)] items-center overflow-hidden md:min-h-[calc(100svh-8rem)]"
      aria-label={t.a11y.hero}
    >
      <div className="absolute inset-0">
        <img
          ref={bgRef}
          src={hero.backgroundImage}
          alt=""
          className="h-full w-full object-cover object-[70%_center] will-change-transform md:object-[75%_center]"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero-overlay absolute inset-0" aria-hidden />
        <NoiseOverlay opacity={0.07} className="z-[1]" />
      </div>

      <Container className="relative z-10 flex w-full items-center py-16 md:py-20">
        <div
          ref={contentRef}
          className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left"
        >
          {eyebrow ? (
            <div data-hero="eyebrow">
              <VuPlate className="mb-5 mx-auto lg:mx-0">{eyebrow}</VuPlate>
            </div>
          ) : null}

          <h1
            data-hero="headline"
            className="font-heading text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.95] tracking-[0.04em] text-white"
          >
            {canSplit ? (
              <>
                {headlineParts[0]}
                <span className="text-primary">{accent}</span>
                {headlineParts.slice(1).join(accent)}
              </>
            ) : (
              hero.headline
            )}
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
              <LayoutGrid size={18} strokeWidth={1.8} aria-hidden />
              {hero.ctaPrimary.label}
            </Link>
            <Link
              to={hero.ctaSecondary.href}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              <Mail size={18} strokeWidth={1.8} aria-hidden />
              {hero.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
