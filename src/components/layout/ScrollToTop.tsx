import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getLenis } from '@/hooks/useLenis'

export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const lenis = getLenis()

    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        if (lenis) {
          lenis.scrollTo(el, { immediate: false })
        } else {
          el.scrollIntoView({ behavior: 'smooth' })
        }
        return
      }
    }

    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
