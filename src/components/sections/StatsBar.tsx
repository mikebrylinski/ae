import {
  Briefcase,
  Globe,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Globe,
  SlidersHorizontal,
  Users,
}

export function StatsBar() {
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  return (
    <section
      className="paper-surface section-divider-top relative overflow-hidden"
      aria-label="Career highlights"
    >
      <Container className="relative z-[2] py-10 md:py-12">
        <motion.ul
          className="grid grid-cols-2 lg:grid-cols-4"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {site.stats.map((stat) => {
            const Icon = (stat.icon && iconMap[stat.icon]) || Briefcase
            const label =
              stat.value > 0
                ? `${stat.value}${stat.suffix ?? ''} ${stat.label}`
                : stat.label

            return (
              <motion.li
                key={stat.label}
                variants={item}
                className="flex flex-col items-center justify-center gap-3.5 border-black/15 px-5 py-7 text-center sm:px-6 sm:py-8 max-lg:[&:nth-child(-n+2)]:border-b max-lg:[&:nth-child(odd)]:border-r lg:border-l lg:first:border-l-0"
              >
                <Icon
                  className="text-black"
                  size={34}
                  strokeWidth={1.4}
                  aria-hidden
                />
                <p className="font-heading text-[13px] tracking-[0.14em] text-black sm:text-sm">
                  {label.toUpperCase()}
                </p>
              </motion.li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
