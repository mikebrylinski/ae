import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GalleryLightboxItem = {
  src: string
  alt: string
}

interface GalleryLightboxProps {
  items: GalleryLightboxItem[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function GalleryLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const open = index !== null && items.length > 0
  const activeIndex = open ? Math.min(Math.max(index, 0), items.length - 1) : 0
  const item = open ? items[activeIndex] : null
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const activeIndexRef = useRef(activeIndex)
  const itemsLengthRef = useRef(items.length)

  activeIndexRef.current = activeIndex
  itemsLengthRef.current = items.length

  useEffect(() => {
    if (!open) return

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus()
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 sm:p-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full w-full max-w-5xl flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <p id={titleId} className="sr-only">
          {item.alt}
        </p>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-heading text-[11px] tracking-[0.16em] text-primary uppercase">
            {showNav ? `${activeIndex + 1} / ${items.length}` : 'View'}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center border border-primary text-primary',
              'transition-colors hover:bg-primary hover:text-primary-foreground',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center border border-border bg-black">
          <img
            src={item.src}
            alt={item.alt}
            className="max-h-[min(80vh,900px)] w-full object-contain"
          />

          {showNav ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onIndexChange((activeIndex - 1 + items.length) % items.length)
                }
                className={cn(
                  'absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center',
                  'border border-primary bg-black/70 text-primary sm:left-3',
                  'transition-colors hover:bg-primary hover:text-primary-foreground',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((activeIndex + 1) % items.length)}
                className={cn(
                  'absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center',
                  'border border-primary bg-black/70 text-primary sm:right-3',
                  'transition-colors hover:bg-primary hover:text-primary-foreground',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
