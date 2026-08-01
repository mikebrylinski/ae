import { motion } from 'framer-motion'
import { testimonials } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function Testimonials() {
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  if (testimonials.length === 0) return null

  return (
    <section
      className="section-divider-top section-pad bg-surface"
      aria-labelledby="testimonials-heading"
    >
      <Container>
        <SectionHeading id="testimonials-heading" title="Trusted On Tour" />

        <motion.ul
          className="grid gap-6 md:grid-cols-2"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {testimonials.map((t) => (
            <motion.li
              key={t.id}
              variants={item}
              className="border border-border bg-black p-6 text-center md:p-8 md:text-left"
            >
              <blockquote className="text-base leading-relaxed text-foreground/90 md:text-lg">
                “{t.quote}”
              </blockquote>
              <footer className="mt-6">
                <p className="font-heading text-sm tracking-[0.1em] text-primary">
                  {t.name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t.role}
                  {t.company ? ` · ${t.company}` : ''}
                </p>
              </footer>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  )
}
