import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const GALLERY_PAGE_SIZE = 24

export function galleryPageWindow(
  current: number,
  total: number,
): Array<number | 'gap'> {
  const pages: Array<number | 'gap'> = []
  for (let i = 1; i <= total; i++) {
    const show = i === 1 || i === total || Math.abs(i - current) <= 1
    if (show) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap')
    }
  }
  return pages
}

export function GalleryPager({
  page,
  pageCount,
  onPage,
  label = 'Gallery pages',
  prevLabel = 'Prev',
  nextLabel = 'Next',
  prevAria = 'Previous page',
  nextAria = 'Next page',
}: {
  page: number
  pageCount: number
  onPage: (page: number) => void
  label?: string
  prevLabel?: string
  nextLabel?: string
  prevAria?: string
  nextAria?: string
}) {
  const pages = galleryPageWindow(page, pageCount)

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label={label}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn(
          'inline-flex h-10 items-center gap-1 border border-border px-3 text-xs tracking-[0.12em] uppercase',
          page <= 1
            ? 'cursor-not-allowed text-muted/40'
            : 'text-muted hover:border-primary hover:text-primary',
        )}
        aria-label={prevAria}
      >
        <ChevronLeft size={14} aria-hidden />
        {prevLabel}
      </button>
      {pages.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'font-heading h-10 min-w-10 border px-3 text-xs tracking-[0.12em]',
              item === page
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className={cn(
          'inline-flex h-10 items-center gap-1 border border-border px-3 text-xs tracking-[0.12em] uppercase',
          page >= pageCount
            ? 'cursor-not-allowed text-muted/40'
            : 'text-muted hover:border-primary hover:text-primary',
        )}
        aria-label={nextAria}
      >
        {nextLabel}
        <ChevronRight size={14} aria-hidden />
      </button>
    </nav>
  )
}
