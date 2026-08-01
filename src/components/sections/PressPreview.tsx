import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { press } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function PressPreview() {
  const items = press.slice(0, 3)
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  return (
    <section
      className="section-divider-top bg-black py-20 sm:py-24 md:py-28 lg:py-32"
      aria-labelledby="press-heading"
    >
      <Container className="px-6 sm:px-10 lg:px-14">
        <SectionHeading
          id="press-heading"
          title="Press & Media"
          align="left"
          action={
            <Link
              to="/media"
              className="font-heading text-xs tracking-[0.16em] text-primary transition-opacity duration-500 hover:opacity-80"
            >
              View All Press
            </Link>
          }
        />

        <motion.ul
          className="grid gap-6 md:grid-cols-3"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {items.map((pressItem) => {
            const hasLink = Boolean(pressItem.url && pressItem.url !== '#')
            const meta = [pressItem.publication, pressItem.date]
              .filter(Boolean)
              .join(' · ')
            const body = (
              <div className="p-5 md:p-6">
                <Badge variant="muted">{pressItem.type}</Badge>
                <h3 className="font-heading mt-3 text-lg tracking-[0.06em] text-white transition-colors duration-500 group-hover:text-primary">
                  {pressItem.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{meta}</p>
                <p className="mt-3 text-sm text-foreground/80">{pressItem.excerpt}</p>
              </div>
            )

            return (
              <motion.li
                key={pressItem.id}
                variants={item}
                className="border border-border bg-surface"
              >
                {hasLink ? (
                  <a
                    href={pressItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block h-full transition-[border-color,box-shadow] duration-500 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
                  >
                    {body}
                  </a>
                ) : (
                  <Link to="/media" className="group block h-full">
                    {body}
                  </Link>
                )}
              </motion.li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
