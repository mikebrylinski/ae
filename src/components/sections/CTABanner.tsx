import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { fadeUp, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasSafariClass } from '@/lib/safari'
import { cn } from '@/lib/utils'

/** Quiet “sea of phones / arena crowd” — soft twinkling dots, very low opacity. */
function CrowdLights({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('cta-crowd', reduced && 'cta-crowd--static')}
    >
      <div className="cta-crowd__field cta-crowd__field--a" />
      <div className="cta-crowd__field cta-crowd__field--b" />
      <div className="cta-crowd__shimmer" />
    </div>
  )
}

/** Floating lime/white specs — rock-show dust above crowd lights. */
const CTA_PARTICLES = [
  { x: '58%', y: '18%', size: 2.5, tone: 'lime', drift: 1 },
  { x: '72%', y: '32%', size: 2, tone: 'white', drift: 2 },
  { x: '88%', y: '22%', size: 2.5, tone: 'lime', drift: 3 },
  { x: '64%', y: '48%', size: 1.5, tone: 'white', drift: 4 },
  { x: '81%', y: '58%', size: 2, tone: 'lime', drift: 5 },
  { x: '94%', y: '44%', size: 1.5, tone: 'white', drift: 6 },
  { x: '54%', y: '68%', size: 2.5, tone: 'white', drift: 7 },
  { x: '76%', y: '78%', size: 2, tone: 'lime', drift: 8 },
  { x: '91%', y: '72%', size: 1.5, tone: 'white', drift: 1 },
  { x: '68%', y: '12%', size: 2, tone: 'lime', drift: 2 },
  { x: '84%', y: '38%', size: 2.5, tone: 'white', drift: 3 },
  { x: '60%', y: '86%', size: 2, tone: 'lime', drift: 4 },
  { x: '48%', y: '28%', size: 1.5, tone: 'white', drift: 5 },
  { x: '96%', y: '62%', size: 2, tone: 'lime', drift: 6 },
  { x: '70%', y: '54%', size: 1.5, tone: 'white', drift: 7 },
  { x: '52%', y: '42%', size: 2, tone: 'lime', drift: 8 },
  { x: '62%', y: '8%', size: 1.5, tone: 'white', drift: 3 },
  { x: '78%', y: '16%', size: 2.5, tone: 'lime', drift: 6 },
  { x: '92%', y: '10%', size: 2, tone: 'lime', drift: 1 },
  { x: '56%', y: '36%', size: 1.5, tone: 'white', drift: 8 },
  { x: '74%', y: '44%', size: 2, tone: 'lime', drift: 2 },
  { x: '86%', y: '50%', size: 1.5, tone: 'white', drift: 4 },
  { x: '98%', y: '28%', size: 2, tone: 'lime', drift: 7 },
  { x: '66%', y: '62%', size: 2.5, tone: 'lime', drift: 5 },
  { x: '80%', y: '68%', size: 1.5, tone: 'white', drift: 3 },
  { x: '90%', y: '84%', size: 2, tone: 'lime', drift: 1 },
  { x: '58%', y: '78%', size: 1.5, tone: 'white', drift: 6 },
  { x: '72%', y: '90%', size: 2, tone: 'lime', drift: 4 },
  { x: '50%', y: '56%', size: 1.5, tone: 'white', drift: 2 },
  { x: '46%', y: '14%', size: 2, tone: 'lime', drift: 8 },
  { x: '82%', y: '26%', size: 1.5, tone: 'white', drift: 5 },
  { x: '68%', y: '72%', size: 2.5, tone: 'lime', drift: 7 },
  { x: '94%', y: '56%', size: 2, tone: 'white', drift: 3 },
  { x: '54%', y: '22%', size: 1.5, tone: 'lime', drift: 1 },
  { x: '76%', y: '6%', size: 2, tone: 'white', drift: 4 },
  { x: '86%', y: '88%', size: 1.5, tone: 'lime', drift: 6 },
  { x: '62%', y: '50%', size: 2, tone: 'white', drift: 2 },
  { x: '48%', y: '74%', size: 1.5, tone: 'lime', drift: 8 },
  { x: '70%', y: '28%', size: 2.5, tone: 'lime', drift: 5 },
  { x: '98%', y: '78%', size: 1.5, tone: 'white', drift: 7 },
] as const

function CtaParticles({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('cta-particles', reduced && 'cta-particles--static')}
    >
      {CTA_PARTICLES.map((p, i) => (
        <span
          key={i}
          className={cn(
            'cta-particles__dot',
            `cta-particles__dot--${p.tone}`,
            `cta-particles__dot--drift-${p.drift}`,
          )}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  )
}

export function CTABanner() {
  const { cta } = site
  const reduced = useReducedMotion()
  const safari = hasSafariClass()
  const item = reduced ? reducedMotionVariants : fadeUp
  const imageSrc = cta.image ?? '/images/about/portrait.jpg'
  const imageAlt = cta.imageAlt ?? 'Andy Ebert at the console'

  return (
    <section className="section-divider-top section-pad bg-black" aria-label="Call to action">
      <Container>
        <motion.div
          className="relative min-h-[22rem] overflow-hidden rounded-[1rem] border border-white/16 md:min-h-[28rem] lg:min-h-[32rem]"
          variants={item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35 md:bg-gradient-to-r md:from-black/20 md:via-black/35 md:to-black/70"
          />
          {safari ? null : <CrowdLights reduced={reduced} />}
          {safari ? null : <CtaParticles reduced={reduced} />}
          {safari ? null : <NoiseOverlay opacity={0.04} className="z-[2]" />}

          <div className="relative z-10 flex min-h-[22rem] items-end p-5 sm:p-7 md:min-h-[28rem] md:items-center md:justify-end md:p-10 lg:min-h-[32rem] lg:p-12">
            <GlassCard className="w-full max-w-lg px-6 py-8 text-center sm:px-8 sm:py-10 md:text-left lg:px-10 lg:py-12">
              <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-5xl">
                {cta.title}
              </h2>
              {cta.subtitle ? (
                <p className="mt-4 text-lg text-primary md:text-xl">{cta.subtitle}</p>
              ) : null}
              <div className="mt-8 flex justify-center md:justify-start">
                <Link
                  to={cta.button.href}
                  className={cn(buttonVariants({ size: 'lg' }), 'inline-flex')}
                >
                  <Mail size={18} strokeWidth={1.8} aria-hidden />
                  {cta.button.label}
                </Link>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
