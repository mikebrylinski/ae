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
import { GlassIcon } from '@/components/ui/GlassCard'
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
      className="stats-bar section-divider-top relative overflow-hidden"
      aria-label="Career highlights"
    >
      <Container className="relative z-[2] py-16 sm:py-20 md:py-24 lg:py-28">
        <motion.ul
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
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
                className="glass-card glass-card--matte flex flex-col items-center justify-center gap-3.5 px-5 py-7 text-center sm:px-6 sm:py-8"
              >
                <GlassIcon>
                  <Icon
                    size={22}
                    strokeWidth={1.6}
                    aria-hidden
                  />
                </GlassIcon>
                <p className="font-heading text-[13px] tracking-[0.14em] text-white sm:text-sm">
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
