import { useEffect, useRef } from 'react'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasSafariClass } from '@/lib/safari'
import { cn } from '@/lib/utils'

const BAR_COUNT = 72
const TIME_SCALE = 0.5
const PEAK_DECAY = 0.006

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Live analyzer used on the old Planning Your Next Production CTA. */
export function CtaSpectrum() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const safari = hasSafariClass()
  const inView = useInView(wrapRef)
  const staticMode = reduced || safari

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const levels = new Float32Array(BAR_COUNT)
    const peaks = new Float32Array(BAR_COUNT)
    const seeds = Float32Array.from({ length: BAR_COUNT }, () => Math.random())
    let t = 0
    let last = performance.now()
    let raf = 0
    let cssW = wrap.clientWidth
    let cssH = wrap.clientHeight

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = Math.max(1, wrap.clientWidth)
      cssH = Math.max(1, wrap.clientHeight)
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const targetFor = (i: number, time: number) => {
      const n = i / (BAR_COUNT - 1)
      const bass = Math.exp(-n * 3.1)
      const kick = Math.max(0, Math.sin(time * 5.15)) ** 10 * bass
      const snare =
        Math.max(0, Math.sin(time * 8.35 + 1.15)) ** 14 *
        Math.exp(-((n - 0.36) ** 2) / 0.038)
      const hat =
        (0.32 + 0.68 * Math.abs(Math.sin(time * 13.6 + i * 0.37))) *
        Math.exp(-((n - 0.78) ** 2) / 0.028) *
        0.52
      const drift =
        (Math.sin(time * (1.55 + seeds[i] * 2.4) + seeds[i] * 11) * 0.5 + 0.5) *
        (0.1 + bass * 0.32)
      return clamp(0.07 + bass * 0.4 + kick * 0.88 + snare * 0.58 + hat + drift, 0, 1)
    }

    const paint = (now: number, animate: boolean) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (animate) t += dt * TIME_SCALE

      const raw = new Float32Array(BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i += 1) raw[i] = targetFor(i, t)
      const follow = animate ? clamp(0.16 * (dt * 60), 0.06, 0.45) : 1
      const decay = animate ? PEAK_DECAY * (dt * 60) : 0

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const left = raw[Math.max(0, i - 1)]
        const right = raw[Math.min(BAR_COUNT - 1, i + 1)]
        const smoothed = raw[i] * 0.54 + left * 0.23 + right * 0.23
        levels[i] += (smoothed - levels[i]) * follow
        if (levels[i] > peaks[i]) peaks[i] = levels[i]
        else peaks[i] = Math.max(levels[i], peaks[i] - decay)
      }

      ctx.clearRect(0, 0, cssW, cssH)

      const gap = Math.max(1.5, cssW * 0.0032)
      const barW = (cssW - gap * (BAR_COUNT - 1)) / BAR_COUNT
      const floor = cssH * 0.06
      const usable = cssH - floor - 6

      ctx.beginPath()
      for (let i = 0; i < BAR_COUNT; i += 1) {
        const x = i * (barW + gap)
        const bh = Math.max(2, levels[i] * usable)
        const y = cssH - floor - bh
        const grad = ctx.createLinearGradient(0, y, 0, cssH - floor)
        grad.addColorStop(0, 'rgba(184,255,0,0.52)')
        grad.addColorStop(0.5, 'rgba(184,255,0,0.2)')
        grad.addColorStop(1, 'rgba(106,153,0,0.07)')
        ctx.fillStyle = grad
        ctx.fillRect(x, y, Math.max(1, barW), bh)

        const py = cssH - floor - Math.max(2, peaks[i] * usable)
        ctx.fillStyle = 'rgba(184,255,0,0.72)'
        ctx.fillRect(x, py, Math.max(1, barW), 1.5)

        const mid = x + barW / 2
        if (i === 0) ctx.moveTo(mid, py)
        else ctx.lineTo(mid, py)
      }
      ctx.strokeStyle = 'rgba(184,255,0,0.42)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    if (staticMode) {
      for (let i = 0; i < 8; i += 1) paint(performance.now(), true)
      paint(performance.now(), false)
      return () => ro.disconnect()
    }

    const loop = (now: number) => {
      if (!document.hidden && inView) paint(now, true)
      else last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [inView, staticMode])

  return (
    <div
      ref={wrapRef}
      className={cn('cta-spectrum', staticMode && 'cta-spectrum--static')}
      aria-hidden
    >
      <canvas ref={canvasRef} className="cta-spectrum__canvas" />
    </div>
  )
}
