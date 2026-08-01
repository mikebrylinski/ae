import {
  Headphones,
  Music,
  SlidersHorizontal,
  Theater,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { services } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const iconMap: Record<string, LucideIcon> = {
  SlidersHorizontal,
  Music,
  Stage: Theater,
  Headphones,
  Theater,
}

export function Services() {
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  return (
    <section
      id="services"
      className="section-divider-top section-pad scroll-mt-24 bg-black"
      aria-labelledby="services-heading"
    >
      <Container>
        <SectionHeading id="services-heading" title="What Andy Brings" />

        <motion.ul
          className="grid sm:grid-cols-2 lg:grid-cols-4"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {services.map((service) => {
            const Icon = iconMap[service.icon] ?? Headphones
            return (
              <motion.li
                key={service.id}
                variants={item}
                className="flex flex-col items-center gap-3.5 border-border/35 px-5 py-7 text-center sm:px-6 sm:py-8 max-sm:border-b max-sm:last:border-b-0 sm:max-lg:[&:nth-child(-n+2)]:border-b sm:max-lg:[&:nth-child(odd)]:border-r lg:border-l lg:first:border-l-0"
              >
                <Icon
                  className="icon-glow-soft text-primary"
                  size={38}
                  strokeWidth={1.4}
                  aria-hidden
                />
                <h3 className="font-heading text-[15px] tracking-[0.12em] text-primary sm:text-base">
                  {service.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted sm:text-base">
                  {service.description}
                </p>
              </motion.li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
