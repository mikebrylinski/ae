import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, staggerContainer, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const FEATURED_BG = '/images/sections/featured-bg.png'

export function FeaturedProjects() {
  const projects = getFeaturedProjects().slice(0, 5)
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const container = reduced ? undefined : staggerContainer

  return (
    <section
      className="relative section-divider-top section-pad overflow-hidden"
      aria-labelledby="featured-heading"
    >
      <div className="absolute inset-0" aria-hidden>
        <img
          src={FEATURED_BG}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        <div className="featured-overlay absolute inset-0" />
      </div>

      <Container className="relative z-10">
        <SectionHeading
          id="featured-heading"
          title="Featured Projects"
          align="left"
          action={
            <Link
              to="/portfolio"
              className="font-heading text-xs tracking-[0.16em] text-primary transition-opacity duration-500 hover:opacity-80"
            >
              View All Projects
            </Link>
          }
        />

        <motion.ul
          className="mx-auto grid max-w-xs grid-cols-2 gap-2.5 sm:max-w-none sm:gap-5 sm:grid-cols-2 lg:grid-cols-5"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {projects.map((project, index) => {
            const isLastOdd = index === projects.length - 1 && projects.length % 2 === 1
            return (
              <motion.li
                key={project.slug}
                variants={item}
                className={cn(
                  'relative z-10',
                  // Center the orphan 5th card on 2-col mobile/tablet grids
                  isLastOdd && 'max-lg:col-span-2 max-lg:mx-auto max-lg:w-[calc(50%-0.3125rem)] sm:max-lg:w-[calc(50%-0.625rem)]',
                )}
              >
                <Link
                  to={`/portfolio/${project.slug}`}
                  className="card-lift group block focus-visible:outline-none"
                >
                  <div className="card-lift__frame relative flex aspect-square flex-col items-center justify-center overflow-hidden border border-border bg-black px-2 py-3 text-center transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_0_28px_rgba(184,255,0,0.08)] sm:px-4 sm:py-5">
                    <h3 className="font-heading text-sm leading-tight tracking-[0.04em] text-white transition-colors duration-500 group-hover:text-primary sm:text-lg lg:text-xl">
                      {project.artist}
                    </h3>
                    <p className="mt-1.5 text-[9px] leading-snug tracking-[0.1em] text-muted uppercase sm:mt-2.5 sm:text-[11px]">
                      {project.year}
                      <span className="mx-1 text-border sm:mx-1.5" aria-hidden>
                        ·
                      </span>
                      {project.role}
                    </p>
                  </div>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
