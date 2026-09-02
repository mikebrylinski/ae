import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getProjectsByCategory,
  SPOTLIGHT_FILTERS,
} from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { ProjectCard } from '@/components/sections/ProjectCard'
import {
  CAREER_CREDITS_SECTION_ID,
  CreditsTimeline,
} from '@/components/sections/CreditsTimeline'
import { CTABanner } from '@/components/sections/CTABanner'
import { buttonVariants } from '@/components/ui/Button'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { VuPlate } from '@/components/ui/VuPlate'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'

const HERO_IMAGE_SRC = '/images/portfolio/console.jpg'
const SPOTLIGHT_PREVIEW_COUNT = 20

export default function PortfolioPage() {
  useSeo({
    title: 'Portfolio',
    description:
      'Selected career credits for monitor engineer Andy Ebert — arena, stadium, amphitheater, festival, TV, and corporate work with year ranges from 1997 to today.',
  })

  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const [active, setActive] = useState<(typeof SPOTLIGHT_FILTERS)[number]>('All')
  const [showAll, setShowAll] = useState(false)
  const filtered = getProjectsByCategory(active)
  const hasMore = filtered.length > SPOTLIGHT_PREVIEW_COUNT
  const visible = showAll ? filtered : filtered.slice(0, SPOTLIGHT_PREVIEW_COUNT)

  function handleFilterChange(cat: (typeof SPOTLIGHT_FILTERS)[number]) {
    setActive(cat)
    setShowAll(false)
  }

  return (
    <>
      <div className="relative isolate overflow-hidden bg-black">
        <PortfolioAurora />

        <section
          id={CAREER_CREDITS_SECTION_ID}
          className="relative z-10 scroll-mt-32 border-b border-border pb-[clamp(4rem,8vw,7rem)] pt-0 md:scroll-mt-40"
        >
          <Container>
            <CreditsTimeline />
          </Container>
        </section>

        <section className="relative z-10 section-pad border-b border-border">
          <Container>
            <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
              <span className="metal-overlay" aria-hidden />
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
                <VuPlate className="shrink-0">Spotlights</VuPlate>
                <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-right">
                  Project Spotlights
                </h2>
              </div>

              <div
                className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10"
                role="tablist"
                aria-label="Filter by category"
              >
                {SPOTLIGHT_FILTERS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active === cat}
                    onClick={() => handleFilterChange(cat)}
                    className={cn(
                      'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
                      active === cat
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted hover:border-primary hover:text-primary',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length > 0 ? (
              <>
                <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {visible.map((project) => (
                    <li key={project.slug}>
                      <ProjectCard project={project} />
                    </li>
                  ))}
                </ul>

                {hasMore ? (
                  <div className="mt-8 flex justify-center sm:mt-10">
                    <button
                      type="button"
                      onClick={() => setShowAll((current) => !current)}
                      className="font-heading border border-primary px-5 py-2.5 text-xs tracking-[0.14em] text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-expanded={showAll}
                    >
                      {showAll
                        ? 'Show less'
                        : `Show more (${filtered.length - SPOTLIGHT_PREVIEW_COUNT})`}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div
                className="spotlight-empty-grid mt-10 flex min-h-[18rem] items-center justify-center border border-border sm:min-h-[22rem]"
                role="status"
                aria-live="polite"
              >
                <p className="font-heading relative z-[1] px-6 text-center text-xs tracking-[0.14em] text-muted uppercase">
                  No projects in {active} yet
                </p>
              </div>
            )}
          </Container>
        </section>

        <section className="relative z-10 section-pad border-b border-border">
          <Container>
            <motion.div
              className="glass-card grid overflow-hidden p-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch"
              variants={reduced ? undefined : staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              <motion.div variants={item} className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                <VuPlate className="mb-3">Credits</VuPlate>
                <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-5xl">
                  Andy's Work
                </h2>
                <div className="mt-4 max-w-2xl space-y-4 text-muted">
                  <p>
                    Andy Ebert is a worldwide touring monitor and FOH engineer,
                    on the road since 1997. From clubs and theatres to arenas,
                    stadiums, festivals, TV, and corporate stages, he mixes for
                    artists who need to hear every detail with confidence.
                  </p>
                  <p>
                    His credits include Alanis Morissette, The Weeknd, Maroon 5,
                    Guns N’ Roses, Mariah Carey, Stone Temple Pilots, Neil Young,
                    and many more. In 2017 he was nominated for the Parnelli Award
                    for Monitor Engineer of the Year.
                  </p>
                </div>
                <Link
                  to="/about"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mt-8 inline-flex w-fit',
                  )}
                >
                  Learn more
                </Link>
              </motion.div>

              <motion.div variants={item} className="min-h-[18rem] sm:min-h-[22rem] lg:min-h-[28rem]">
                <MediaImage
                  src={HERO_IMAGE_SRC}
                  alt="Andy Ebert at a mixing console in an arena"
                  aspect="h-full min-h-[18rem] aspect-[4/5] sm:min-h-[22rem] sm:aspect-[5/4] lg:aspect-auto lg:min-h-full"
                  className="object-cover object-[center_30%]"
                  wrapperClassName="h-full border-0"
                  fallbackLabel="Andy Ebert"
                />
              </motion.div>
            </motion.div>
          </Container>
        </section>
      </div>
      <CTABanner />
    </>
  )
}
