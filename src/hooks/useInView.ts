import { useEffect, useState, type RefObject } from 'react'

/** Tracks whether `ref` is currently intersecting the viewport. */
export function useInView(
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit,
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '80px', threshold: 0, ...options },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, options?.rootMargin, options?.threshold])

  return inView
}
