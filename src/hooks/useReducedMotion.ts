import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCheapMotion() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('is-safari') || prefersReducedMotion()
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(isCheapMotion)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(isCheapMotion())
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}
