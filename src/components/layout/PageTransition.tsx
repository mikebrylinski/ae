import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, Outlet } from 'react-router-dom'
import { pageTransition } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasSafariClass } from '@/lib/safari'

export function PageTransition() {
  const location = useLocation()
  const reduced = useReducedMotion()

  if (reduced || hasSafariClass()) {
    return (
      <div className="min-h-[60vh] min-w-0">
        <Outlet />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-[60vh]"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
