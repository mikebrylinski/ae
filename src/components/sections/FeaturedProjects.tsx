import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { MediaImage } from '@/components/ui/MediaImage'
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
          titleClassName="text-primary"
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
          className="mx-auto grid max-w-sm grid-cols-2 gap-3 sm:max-w-none sm:gap-5 sm:grid-cols-2 lg:grid-cols-5"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {projects.map((project, index) => {
            const src = project.logo || project.thumbnail
            const isLastOdd = index === projects.length - 1 && projects.length % 2 === 1
            return (
              <motion.li
                key={project.slug}
                variants={item}
                className={cn(
                  'relative z-10',
                  // Center the orphan 5th card on 2-col mobile/tablet grids
                  isLastOdd && 'max-lg:col-span-2 max-lg:mx-auto max-lg:w-[calc(50%-0.375rem)] sm:max-lg:w-[calc(50%-0.625rem)]',
                )}
              >
                <Link
                  to={`/portfolio/${project.slug}`}
                  className="card-lift group block focus-visible:outline-none"
                >
                  <MediaImage
                    src={src}
                    alt={`${project.artist} logo`}
                    aspect="aspect-square"
                    fit="contain"
                    fallbackLabel={project.artist}
                    className="!box-border !h-full !w-full !object-contain !object-center !p-5 sm:!p-6"
                    wrapperClassName="card-lift__frame transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_0_28px_rgba(184,255,0,0.08)]"
                  />
                  <div className="mt-2.5 text-center sm:mt-3 lg:text-left">
                    <h3 className="font-heading text-sm tracking-[0.08em] text-white transition-colors duration-500 group-hover:text-primary sm:text-base">
                      {project.artist}
                    </h3>
                    <p className="mt-1 text-[11px] tracking-wide text-muted uppercase sm:text-xs">
                      {project.title}
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
