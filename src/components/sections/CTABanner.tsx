import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { NoiseOverlay } from '@/components/ui/NoiseOverlay'
import { fadeUp, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useInView } from '@/hooks/useInView'
import { hasSafariClass } from '@/lib/safari'
import { cn } from '@/lib/utils'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Soft, bass-weighted analyzer levels — musical, not random noise. */
function analyzerLevel(i: number, count: number, t: number): number {
  const n = i / Math.max(1, count - 1)

  const envelope =
    0.58 * Math.exp(-n * 2.05) +
    0.36 * Math.exp(-((n - 0.16) ** 2) / 0.03) +
    0.26 * Math.exp(-((n - 0.4) ** 2) / 0.024) +
    0.18 * Math.exp(-((n - 0.66) ** 2) / 0.02) +
    0.12 * Math.exp(-((n - 0.9) ** 2) / 0.014)

  const kick = Math.pow(Math.max(0, Math.sin(t * 3.7)), 6)
  const snare = Math.pow(Math.max(0, Math.sin(t * 7.4 + 1.15)), 10)
  const hat = Math.pow(Math.max(0, Math.sin(t * 14.8 + 0.4)), 14)

  const pulse =
    kick * Math.exp(-n * 4.2) * 0.42 +
    snare * Math.exp(-((n - 0.36) ** 2) / 0.045) * 0.28 +
    hat * Math.max(0, (n - 0.58) / 0.42) * 0.22

  const shimmer =
    0.2 * Math.sin(t * 1.15 + i * 0.31) +
    0.12 * Math.sin(t * 2.35 + i * 0.67) +
    0.08 * Math.sin(t * 3.9 + n * 8.4) +
    0.05 * Math.sin(t * 0.42 + i * 0.08)

  return clamp(envelope * (0.4 + 0.38 * (0.5 + shimmer) + pulse), 0.05, 0.96)
}

function paintSpectrum(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  levels: Float32Array,
  peaks: Float32Array,
  dt: number,
) {
  const count = levels.length
  const gap = Math.max(1.5, Math.min(3, w / 420))
  const barW = (w - gap * (count - 1)) / count
  const radius = Math.min(2.5, barW * 0.35)

  for (let i = 0; i < count; i++) {
    levels[i] = analyzerLevel(i, count, t)
  }

  for (let i = 0; i < count; i++) {
    const a = levels[Math.max(0, i - 1)]
    const b = levels[i]
    const c = levels[Math.min(count - 1, i + 1)]
    const smoothed = a * 0.18 + b * 0.64 + c * 0.18
    levels[i] = smoothed
    peaks[i] = Math.max(smoothed, peaks[i] - dt * 0.21)
  }

  ctx.clearRect(0, 0, w, h)

  const fill = ctx.createLinearGradient(0, h, 0, 0)
  fill.addColorStop(0, 'rgba(184, 255, 0, 0.03)')
  fill.addColorStop(0.28, 'rgba(184, 255, 0, 0.09)')
  fill.addColorStop(0.62, 'rgba(184, 255, 0, 0.22)')
  fill.addColorStop(1, 'rgba(230, 255, 150, 0.4)')
  ctx.fillStyle = fill

  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const barH = Math.max(2, levels[i] * h)
    const x = i * (barW + gap)
    const y = h - barH
    const r = Math.min(radius, barW / 2, barH / 2)
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, barW, barH, [r, r, 0, 0])
    } else {
      ctx.rect(x, y, barW, barH)
    }
  }
  ctx.fill()

  ctx.fillStyle = 'rgba(184, 255, 0, 0.5)'
  for (let i = 0; i < count; i++) {
    const peakH = peaks[i] * h
    const x = i * (barW + gap)
    const y = h - peakH - 3
    if (y < 0) continue
    ctx.fillRect(x, y, barW, 1.5)
  }

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(184, 255, 0, 0.26)'
  ctx.lineWidth = 1.15
  ctx.lineJoin = 'round'
  for (let i = 0; i < count; i++) {
    const x = i * (barW + gap) + barW / 2
    const y = h - levels[i] * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const STATIC_T = 2.35

function CtaSpectrum({ reduced }: { reduced: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(wrapRef)
  const animate = !reduced && inView

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let levels = new Float32Array(48)
    let peaks = new Float32Array(48)
    const origin = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, wrap.clientWidth)
      const h = Math.max(1, wrap.clientHeight)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const next = Math.round(clamp(w / 13, 36, 88))
      if (next !== levels.length) {
        levels = new Float32Array(next)
        peaks = new Float32Array(next)
      }
    }

    const draw = (now: number) => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (w < 2 || h < 2) return
      // Half-speed motion so the analyzer reads as a slow wash, not a strobe.
      const t = animate ? (now - origin) / 2000 : STATIC_T
      const dt = clamp((now - last) / 2000, 0.001, 0.05)
      last = now
      paintSpectrum(ctx, w, h, t, levels, peaks, animate ? dt : 0)
    }

    const loop = (now: number) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const onVis = () => {
      if (!animate) return
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    draw(performance.now())

    const ro = new ResizeObserver(() => {
      resize()
      if (!animate) draw(performance.now())
    })
    ro.observe(wrap)

    if (animate) {
      raf = requestAnimationFrame(loop)
      document.addEventListener('visibilitychange', onVis)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [animate])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('cta-spectrum', reduced && 'cta-spectrum--static')}
    >
      <canvas ref={canvasRef} className="cta-spectrum__canvas" />
    </div>
  )
}

export function CTABanner() {
  const { cta } = site
  const reduced = useReducedMotion()
  const safari = hasSafariClass()
  const item = reduced ? reducedMotionVariants : fadeUp
  const imageSrc = cta.image ?? '/images/about/portrait.jpg'
  const imageAlt = cta.imageAlt ?? 'Andy Ebert at the console'

  return (
    <section className="section-divider-top section-pad bg-black" aria-label="Call to action">
      <Container>
        <motion.div
          className="relative min-h-[22rem] overflow-hidden rounded-[1rem] border border-white/16 md:min-h-[28rem] lg:min-h-[32rem]"
          variants={item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center grayscale"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35 md:bg-gradient-to-r md:from-black/20 md:via-black/35 md:to-black/70"
          />
          <CtaSpectrum reduced={reduced || safari} />
          {safari ? null : <NoiseOverlay opacity={0.04} className="z-[2]" />}

          <div className="relative z-10 flex min-h-[22rem] items-end p-5 sm:p-7 md:min-h-[28rem] md:items-center md:justify-end md:p-10 lg:min-h-[32rem] lg:p-12">
            <GlassCard className="w-full max-w-lg px-6 py-8 text-center sm:px-8 sm:py-10 md:text-left lg:px-10 lg:py-12">
              <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-5xl">
                {cta.title}
              </h2>
              {cta.subtitle ? (
                <p className="mt-4 text-lg text-primary md:text-xl">{cta.subtitle}</p>
              ) : null}
              <div className="mt-8 flex justify-center md:justify-start">
                <Link
                  to={cta.button.href}
                  className={cn(buttonVariants({ size: 'lg' }), 'inline-flex rounded-[1rem]')}
                >
                  <Mail size={18} strokeWidth={1.8} aria-hidden />
                  {cta.button.label}
                </Link>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
