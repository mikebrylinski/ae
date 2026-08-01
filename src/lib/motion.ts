import type { Transition, Variants } from 'framer-motion'

/** Soft ease — restrained, not snappy. */
export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const defaultTransition: Transition = {
  duration: 1.15,
  ease: easeOutExpo,
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
}

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.988 },
  visible: { opacity: 1, scale: 1, transition: defaultTransition },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: 14 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -3,
    transition: { duration: 0.35, ease: 'easeIn' },
  },
}

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
