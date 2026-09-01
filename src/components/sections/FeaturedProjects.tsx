import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, staggerContainer, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const FEATURED_BG = '/images/sections/featured-bg.png'

export function FeaturedProjects() {
  const projects = getFeaturedProjects().slice(0, 6)
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
          eyebrow="Featured"
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
          className="flex flex-wrap justify-center gap-5 sm:gap-6 lg:gap-8"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {projects.map((project) => (
            <motion.li
              key={project.slug}
              variants={item}
              className="relative z-10 min-w-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc((100%-4rem)/3)]"
            >
              <Link
                to={`/portfolio/${project.slug}`}
                className="card-lift group block focus-visible:outline-none"
              >
                <div className="glass-card card-lift__frame relative flex aspect-[3/4] flex-col items-center justify-end overflow-hidden px-5 py-6 text-center transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1.5 group-hover:border-primary/35 group-hover:shadow-[0_0_36px_rgba(184,255,0,0.1)] sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                  {project.cardImage ? (
                    <>
                      <img
                        src={project.cardImage}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        loading="lazy"
                        decoding="async"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30"
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <div className="relative z-[1] min-w-0 max-w-full">
                    <h3 className="font-heading text-xl leading-tight tracking-[0.04em] text-white transition-colors duration-500 group-hover:text-primary sm:text-2xl lg:text-[1.75rem]">
                      {project.artist}
                    </h3>
                    <p className="mt-2 text-xs leading-snug tracking-[0.12em] text-white/75 uppercase sm:mt-2.5 sm:text-sm">
                      {project.year}
                      <span className="mx-1.5 text-white/35" aria-hidden>
                        ·
                      </span>
                      {project.role}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  )
}
