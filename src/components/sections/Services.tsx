import {
  AudioLines,
  Gauge,
  Headphones,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { services } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassIcon } from '@/components/ui/GlassCard'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const iconMap: Record<string, LucideIcon> = {
  Headphones,
  AudioLines,
  Gauge,
}

export function Services() {
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  return (
    <section
      id="services"
      className="services-panel section-divider-top relative scroll-mt-24 overflow-hidden"
      aria-labelledby="services-heading"
    >
      <Container className="relative z-[2] py-16 sm:py-20 md:py-24 lg:py-28">
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="What Andy Brings"
          className="[&_h2]:text-black"
        />

        <motion.ul
          className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {services.map((service) => {
            const Icon = (service.icon && iconMap[service.icon]) || Headphones
            return (
              <motion.li
                key={service.id}
                variants={item}
                className="glass-card flex flex-col items-center gap-3.5 px-5 py-7 text-center sm:px-6 sm:py-8"
              >
                <GlassIcon>
                  <Icon
                    className="icon-glow-soft"
                    size={22}
                    strokeWidth={1.6}
                    aria-hidden
                  />
                </GlassIcon>
                <h3 className="font-heading text-[15px] tracking-[0.12em] text-white sm:text-base">
                  {service.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-white/75 sm:text-base">
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
