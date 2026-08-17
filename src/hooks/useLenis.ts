import { useEffect } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from './useReducedMotion'
import { isSafariBrowser } from '@/lib/safari'

let lenisInstance: Lenis | null = null

/** Active Lenis instance when smooth scroll is enabled; null otherwise. */
export function getLenis() {
  return lenisInstance
}

export function useLenis() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion || isSafariBrowser()) return

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    })
    lenisInstance = lenis

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      if (lenisInstance === lenis) {
        lenisInstance = null
      }
    }
  }, [reducedMotion])
}
