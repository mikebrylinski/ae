import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects, localizeProject } from '@/lib/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, staggerContainer, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/Button'

const FEATURED_BG = '/images/sections/featured-bg.png'

const CARD_IMAGE_FOCUS: Record<string, string> = {
  'guns-n-roses': 'object-[68%_center]',
  'maroon-5': 'object-[center_58%]',
}

export function FeaturedProjects() {
  const { lang, t } = useLanguage()
  const projects = getFeaturedProjects().slice(0, 6).map((p) =>
    localizeProject(p, lang),
  )
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
          eyebrow={t.featured.eyebrow}
          title={t.featured.title}
          align="left"
          action={
            <Link
              to="/portfolio"
              className="font-heading text-xs tracking-[0.16em] text-primary transition-opacity duration-500 hover:opacity-80"
            >
              {t.featured.viewAll}
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
                <div className="glass-card card-lift__frame relative flex flex-col overflow-hidden bg-black transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1.5 group-hover:border-primary/35 group-hover:shadow-[0_0_36px_rgba(184,255,0,0.1)]">
                  <div className="relative z-[1] aspect-[3/4] w-full overflow-hidden bg-black">
                    {project.cardImage ? (
                      <img
                        src={project.cardImage}
                        alt=""
                        aria-hidden
                        className={cn(
                          'absolute inset-0 h-full w-full object-cover brightness-100 transition-transform duration-700 ease-out group-hover:scale-[1.04]',
                          CARD_IMAGE_FOCUS[project.slug] ?? 'object-center',
                        )}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <div className="relative z-[1] flex min-w-0 flex-col items-center bg-black px-5 py-5 text-center sm:px-6 sm:py-6">
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
                    <span
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'mt-4 pointer-events-none',
                      )}
                    >
                      {t.featured.details}
                    </span>
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
