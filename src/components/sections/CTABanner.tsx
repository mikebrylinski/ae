import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { getSite } from '@/lib/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { fadeUp, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasSafariClass } from '@/lib/safari'
import { cn } from '@/lib/utils'

export function CTABanner() {
  const { lang, t } = useLanguage()
  const { cta } = getSite(lang)
  const reduced = useReducedMotion()
  const safari = hasSafariClass()
  const item = reduced ? reducedMotionVariants : fadeUp
  const imageSrc = cta.image ?? '/images/about/portrait.jpg'
  const imageAlt = cta.imageAlt ?? 'Andy Ebert at the console'

  return (
    <section className="section-divider-top section-pad bg-black" aria-label={t.a11y.cta}>
      <Container>
        <motion.div
          className="relative overflow-hidden rounded-[1rem] border border-white/16 bg-black"
          variants={item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {safari ? null : <NoiseOverlay opacity={0.04} className="z-[2]" />}

          <div className="relative z-10 grid min-h-[24rem] md:min-h-[30rem] md:grid-cols-[minmax(0,1fr)_minmax(20rem,32rem)] lg:min-h-[34rem]">
            <div className="relative min-h-[18rem] md:min-h-0">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="absolute inset-0 h-full w-full object-cover object-left"
                loading="lazy"
                decoding="async"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/45"
              />
            </div>

            <div className="flex items-center p-5 sm:p-7 md:p-8 lg:p-10">
              <GlassCard className="w-full px-6 py-8 text-center sm:px-8 sm:py-10 md:text-left lg:px-10 lg:py-12">
                <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-5xl">
                  {cta.title}
                </h2>
                {cta.subtitle ? (
                  <p className="mt-4 text-lg text-primary md:text-xl">{cta.subtitle}</p>
                ) : null}
                <div className="mt-8 flex justify-center md:justify-start">
                  <Link
                    to={cta.button.href}
                    className={cn(buttonVariants({ size: 'lg' }), 'inline-flex rounded-[1rem]')}
                  >
                    <Mail size={18} strokeWidth={1.8} aria-hidden />
                    {cta.button.label}
                  </Link>
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
