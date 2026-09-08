import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const MAGIC_LINE = 'AH AH AH. YOU DIDNT SAY THE MAGIC WORD.'

export function MagicWordLock() {
  const reduced = useReducedMotion()
  const [typed, setTyped] = useState(reduced ? MAGIC_LINE : '')

  useEffect(() => {
    if (reduced) {
      setTyped(MAGIC_LINE)
      return
    }

    let i = 0
    let timer = 0
    let cancelled = false
    setTyped('')

    const type = () => {
      if (cancelled) return
      i += 1
      setTyped(MAGIC_LINE.slice(0, i))
      if (i >= MAGIC_LINE.length) {
        timer = window.setTimeout(() => {
          if (cancelled) return
          i = 0
          setTyped('')
          timer = window.setTimeout(type, 500)
        }, 2400)
        return
      }
      timer = window.setTimeout(type, 110)
    }

    timer = window.setTimeout(type, 200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reduced])

  return (
    <div className="magic-word" aria-hidden>
      <p className="magic-word__type">
        {typed}
        {reduced ? null : <span className="magic-word__caret" />}
      </p>
    </div>
  )
}
