import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { experience, getAllCategories, getProjectsByCategory } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { ProjectCard } from '@/components/sections/ProjectCard'
import { CreditsTimeline } from '@/components/sections/CreditsTimeline'
import { CTABanner } from '@/components/sections/CTABanner'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { VuPlate } from '@/components/ui/VuPlate'

const HERO_IMAGE_SRC = '/images/portfolio/console.jpg'

export default function PortfolioPage() {
  useSeo({
    title: 'Portfolio',
    description:
      'Selected career credits for monitor engineer Andy Ebert — arena, stadium, amphitheater, festival, TV, and corporate work with year ranges from 1997 to today.',
  })

  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const categories = useMemo(() => getAllCategories(), [])
  const [active, setActive] = useState('All')
  const filtered = getProjectsByCategory(active)

  return (
    <>
      <section className="section-pad border-b border-border bg-black">
        <Container>
          <motion.div
            className="glass-card grid overflow-hidden p-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch"
            variants={reduced ? undefined : staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={item} className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
              <VuPlate className="mb-3">Credits</VuPlate>
              <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl md:text-6xl">
                Portfolio
              </h1>
              <p className="mt-4 max-w-2xl text-muted">
                Selected arena, stadium, amphitheater, festival, TV, and
                corporate credits — consecutive years collapsed into ranges.
                Alanis Morissette, The Weeknd, Maroon 5, Guns N’ Roses, and
                more.
              </p>
              {experience.award ? (
                <p className="font-heading mt-6 max-w-2xl text-sm tracking-[0.12em] text-primary">
                  {experience.award}
                </p>
              ) : null}
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

          <div className="mt-14 border-t border-border pt-14 md:mt-16 md:pt-16">
            <VuPlate className="mb-3">Selected</VuPlate>
            <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
              Project Spotlights
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Deeper looks at key tours and productions.
            </p>

            <div
              className="mt-10 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active === cat}
                  onClick={() => setActive(cat)}
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

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
              {filtered.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>

            {filtered.length === 0 ? (
              <p className="mt-12 text-muted">No projects in this category yet.</p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="section-pad border-b border-border bg-black">
        <Container>
          <VuPlate className="mb-3">Timeline</VuPlate>
          <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
            Career Credits
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Arena, stadium, and touring highlights by year — filter by monitors
            or FOH.
          </p>

          <div className="mt-10">
            <CreditsTimeline />
          </div>
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
