import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { shareOrCopyUrl } from '@/lib/share'
import { getLenis } from '@/hooks/useLenis'
import { useLanguage } from '@/i18n/LanguageProvider'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

export type GalleryLightboxItem = {
  src: string
  alt: string
  caption?: string
  sharePath?: string
}

interface GalleryLightboxProps {
  items: GalleryLightboxItem[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

function muteMouseFocus(event: React.MouseEvent) {
  event.preventDefault()
}

const chromeBtn =
  'inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-primary bg-black/80 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function GalleryLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const { t } = useLanguage()
  const open = index !== null && items.length > 0
  const activeIndex = open ? Math.min(Math.max(index, 0), items.length - 1) : 0
  const item = open ? items[activeIndex] : null
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const activeIndexRef = useRef(activeIndex)
  const itemsLengthRef = useRef(items.length)
  const transformRef = useRef({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  )
  const movedRef = useRef(0)
  const [copied, setCopied] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  activeIndexRef.current = activeIndex
  itemsLengthRef.current = items.length

  function commit(next: { scale: number; x: number; y: number }) {
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.scale))
    const x = nextScale <= MIN_ZOOM ? 0 : next.x
    const y = nextScale <= MIN_ZOOM ? 0 : next.y
    transformRef.current = { scale: nextScale, x, y }
    setScale(nextScale)
    setPan({ x, y })
  }

  function zoomToward(nextScale: number, clientX: number, clientY: number) {
    const stage = stageRef.current
    const current = transformRef.current
    const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale))
    if (!stage) {
      commit({ scale: target, x: 0, y: 0 })
      return
    }
    const rect = stage.getBoundingClientRect()
    const px = clientX - rect.left - rect.width / 2
    const py = clientY - rect.top - rect.height / 2
    const k = target / current.scale
    commit({
      scale: target,
      x: px - k * (px - current.x),
      y: py - k * (py - current.y),
    })
  }

  function zoomBy(factor: number) {
    const stage = stageRef.current
    if (!stage) {
      commit({ scale: transformRef.current.scale * factor, x: 0, y: 0 })
      return
    }
    const rect = stage.getBoundingClientRect()
    zoomToward(
      transformRef.current.scale * factor,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    )
  }

  useEffect(() => {
    setCopied(false)
    commit({ scale: 1, x: 0, y: 0 })
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const lenis = getLenis() as { stop?: () => void; start?: () => void } | null
    lenis?.stop?.()
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      lenis?.start?.()
      previouslyFocused.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (event: WheelEvent) => {
      if (transformRef.current.scale <= MIN_ZOOM) return
      event.preventDefault()
      event.stopPropagation()
      const factor = event.deltaY > 0 ? 0.8 : 1.35
      zoomToward(transformRef.current.scale * factor, event.clientX, event.clientY)
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [open, item?.src])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomBy(2)
        return
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        zoomBy(0.5)
        return
      }

      if (transformRef.current.scale > 1) return

      const length = itemsLengthRef.current
      if (length < 2) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onIndexChange((activeIndexRef.current - 1 + length) % length)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onIndexChange((activeIndexRef.current + 1) % length)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, onIndexChange])

  if (!open || !item) return null

  const showNav = items.length > 1
  const sharePath = item.sharePath
  const caption = (item.caption || item.alt).trim()
  const zoomed = scale > 1.02

  async function share() {
    if (!sharePath) return
    const url = `${window.location.origin}${sharePath}`
    try {
      await shareOrCopyUrl(url, caption, () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2500)
      })
    } catch {
      /* share cancelled or clipboard blocked */
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    movedRef.current = 0
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const points = [...pointersRef.current.values()]
    if (points.length === 2) {
      dragRef.current = null
      pinchRef.current = {
        dist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        scale: transformRef.current.scale,
      }
      return
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: transformRef.current.x,
      panY: transformRef.current.y,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const points = [...pointersRef.current.values()]
    if (points.length >= 2 && pinchRef.current) {
      if (pinchRef.current.scale <= MIN_ZOOM) return
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const midX = (points[0].x + points[1].x) / 2
      const midY = (points[0].y + points[1].y) / 2
      const next = pinchRef.current.scale * (dist / Math.max(pinchRef.current.dist, 1))
      zoomToward(next, midX, midY)
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    movedRef.current = Math.max(movedRef.current, Math.hypot(dx, dy))
    if (transformRef.current.scale <= 1 || movedRef.current < 8) return
    commit({
      scale: transformRef.current.scale,
      x: drag.panX + dx,
      y: drag.panY + dy,
    })
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) dragRef.current = null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 sm:p-8 select-none"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-full max-w-full outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <p id={titleId} className="sr-only">
          {item.alt}
        </p>

        <div className="relative mx-auto flex w-fit max-w-full flex-col overflow-hidden rounded-[1rem] border border-border bg-black">
          <div className="relative">
            <div
              ref={stageRef}
              className={cn(
                'relative touch-none overflow-hidden outline-none select-none',
                zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="pointer-events-none block h-auto max-h-[min(78vh,860px)] w-auto max-w-[min(100vw-2rem,72rem)] origin-center select-none [-webkit-user-drag:none] will-change-transform"
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
                }}
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>

            {showNav ? (
              <p className="font-heading pointer-events-none absolute top-3 left-3 z-10 rounded-[1rem] border border-primary bg-black/80 px-3 py-1.5 text-[11px] tracking-[0.16em] text-primary uppercase">
                {`${activeIndex + 1} / ${items.length}`}
              </p>
            ) : null}

            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                type="button"
                className={chromeBtn}
                onMouseDown={muteMouseFocus}
                onClick={() => zoomBy(0.5)}
                disabled={scale <= MIN_ZOOM}
                aria-label={t.a11y.zoomOut}
              >
                <ZoomOut className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className={chromeBtn}
                onMouseDown={muteMouseFocus}
                onClick={() => zoomBy(2)}
                disabled={scale >= MAX_ZOOM}
                aria-label={t.a11y.zoomIn}
              >
                <ZoomIn className="h-5 w-5" aria-hidden />
              </button>
              {sharePath ? (
                <button
                  type="button"
                  onMouseDown={muteMouseFocus}
                  onClick={() => void share()}
                  className={cn(chromeBtn, 'w-auto min-w-[7.5rem] gap-2 px-3')}
                  aria-label={copied ? t.galleryPage.copied : t.a11y.sharePhoto}
                >
                  <Share2 className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="font-heading whitespace-nowrap text-[11px] tracking-[0.14em] uppercase">
                    {copied ? t.galleryPage.copied : t.galleryPage.share}
                  </span>
                </button>
              ) : null}
              <button
                ref={closeRef}
                type="button"
                onMouseDown={muteMouseFocus}
                onClick={onClose}
                className={chromeBtn}
                aria-label={t.a11y.closeLightbox}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {showNav && !zoomed ? (
              <>
                <button
                  type="button"
                  onMouseDown={muteMouseFocus}
                  onClick={() =>
                    onIndexChange((activeIndex - 1 + items.length) % items.length)
                  }
                  className={cn(
                    chromeBtn,
                    'absolute top-1/2 left-2 z-10 -translate-y-1/2 sm:left-3',
                  )}
                  aria-label={t.a11y.prevImage}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onMouseDown={muteMouseFocus}
                  onClick={() => onIndexChange((activeIndex + 1) % items.length)}
                  className={cn(
                    chromeBtn,
                    'absolute top-1/2 right-2 z-10 -translate-y-1/2 sm:right-3',
                  )}
                  aria-label={t.a11y.nextImage}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : null}
          </div>

          {item.caption || item.alt ? (
            <span className="block w-full min-w-0 bg-black px-4 py-3 text-center font-heading text-[11px] leading-snug tracking-[0.04em] text-white sm:text-[13px]">
              <span className="line-clamp-3">{item.caption || item.alt}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
