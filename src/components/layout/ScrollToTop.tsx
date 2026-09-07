import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { getLenis } from '@/hooks/useLenis'

function readScrollY() {
  const lenis = getLenis()
  return Number(lenis ? lenis.scroll : window.scrollY)
}

function writeScrollY(top: number) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(top, { immediate: true })
  } else {
    window.scrollTo(0, top)
  }
}

export function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const prevKey = useRef(location.key)
  const prevPath = useRef(location.pathname)
  const prevHash = useRef(location.hash)

  useEffect(() => {
    positions.current.set(prevKey.current, readScrollY())
    prevKey.current = location.key

    if (navType === 'POP') {
      const y = positions.current.get(location.key) ?? 0
      prevPath.current = location.pathname
      prevHash.current = location.hash
      requestAnimationFrame(() => {
        requestAnimationFrame(() => writeScrollY(y))
      })
      return
    }

    const pathChanged = prevPath.current !== location.pathname
    const hashChanged = prevHash.current !== location.hash
    prevPath.current = location.pathname
    prevHash.current = location.hash

    if (!pathChanged && !hashChanged) return

    const lenis = getLenis()

    if (location.hash) {
      const id = location.hash.replace('#', '')
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

    writeScrollY(0)
  }, [location.pathname, location.hash, location.key, navType])

  return null
}
