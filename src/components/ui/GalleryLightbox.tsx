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
import {
  GALLERY_MAX_ZOOM,
  GALLERY_MIN_ZOOM,
  useGalleryZoom,
} from '@/hooks/useGalleryZoom'
import { useLanguage } from '@/i18n/LanguageProvider'

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

export function muteMouseFocus(event: React.MouseEvent) {
  if (window.matchMedia('(pointer: coarse)').matches) return
  event.preventDefault()
}

export const galleryChromeBtn =
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
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const activeIndexRef = useRef(activeIndex)
  const itemsLengthRef = useRef(items.length)
  const ignoreBackdropUntil = useRef(0)
  const [copied, setCopied] = useState(false)
  const {
    stageRef,
    scale,
    pan,
    zoomed,
    zoomBy,
    transformRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useGalleryZoom(item?.src ?? '')

  activeIndexRef.current = activeIndex
  itemsLengthRef.current = items.length

  useEffect(() => {
    setCopied(false)
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    ignoreBackdropUntil.current = Date.now() + 600
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const lenis = getLenis() as { stop?: () => void; start?: () => void } | null
    lenis?.stop?.()
    closeRef.current?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = overflow
      lenis?.start?.()
      previouslyFocused.current?.focus({ preventScroll: true })
    }
  }, [open])

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
  }, [open, onClose, onIndexChange, transformRef, zoomBy])

  if (!open || !item) return null

  const showNav = items.length > 1
  const sharePath = item.sharePath
  const caption = (item.caption || item.alt).trim()

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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 sm:p-8 select-none"
      role="presentation"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        if (Date.now() < ignoreBackdropUntil.current) return
        onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-full max-w-full outline-none"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
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
                className={galleryChromeBtn}
                onMouseDown={muteMouseFocus}
                onClick={() => zoomBy(0.5)}
                disabled={scale <= GALLERY_MIN_ZOOM}
                aria-label={t.a11y.zoomOut}
              >
                <ZoomOut className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className={galleryChromeBtn}
                onMouseDown={muteMouseFocus}
                onClick={() => zoomBy(2)}
                disabled={scale >= GALLERY_MAX_ZOOM}
                aria-label={t.a11y.zoomIn}
              >
                <ZoomIn className="h-5 w-5" aria-hidden />
              </button>
              {sharePath ? (
                <button
                  type="button"
                  onMouseDown={muteMouseFocus}
                  onClick={() => void share()}
                  className={cn(galleryChromeBtn, 'w-auto min-w-[7.5rem] gap-2 px-3')}
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
                className={galleryChromeBtn}
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
                    galleryChromeBtn,
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
                    galleryChromeBtn,
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
