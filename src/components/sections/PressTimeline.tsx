import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import {
  getPressItems,
  getProjectBySlug,
  localizePressType,
  pressAnchorProps,
  type PressTypeFilter,
} from '@/lib/content'
import { interpolate } from '@/i18n/ui'
import { useLanguage } from '@/i18n/LanguageProvider'
import { getLenis } from '@/hooks/useLenis'
import { Badge } from '@/components/ui/Badge'
import { VuPlate } from '@/components/ui/VuPlate'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { PressItem } from '@/types'

const TYPE_FILTER_IDS: PressTypeFilter[] = ['all', 'Interview', 'Article', 'Review']

const PAGE_SIZE = 10

export const PRESS_SECTION_ID = 'press-timeline'

function yearFromItem(item: PressItem): string {
  const year = item.sortDate.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : item.date || '—'
}

function scrollPressSectionIntoView(reduced: boolean) {
  const el = document.getElementById(PRESS_SECTION_ID)
  if (!el) return

  const header = document.querySelector<HTMLElement>('.rack-header')
  const headerH = header?.getBoundingClientRect().height ?? 0
  const lenis = getLenis()
  const current = lenis ? lenis.scroll : window.scrollY
  const top = Math.max(0, el.getBoundingClientRect().top + current - headerH - 8)

  if (lenis) {
    lenis.scrollTo(top, { immediate: reduced })
  } else {
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }
}

function PressPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  label,
  variant = 'bar',
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  label: string
  variant?: 'bar' | 'rail'
}) {
  const isRail = variant === 'rail'
  const { t } = useLanguage()

  return (
    <nav
      className={cn(
        'flex flex-nowrap items-center',
        isRail ? 'justify-center gap-1 sm:justify-end' : 'justify-center gap-2 sm:justify-between sm:gap-4',
        className,
      )}
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={t.a11y.prevPage}
        className={cn(
          'font-heading shrink-0 border uppercase transition-colors',
          isRail
            ? 'px-1.5 py-1 text-[9px] tracking-[0.08em]'
            : 'px-2.5 py-2 text-[10px] tracking-[0.1em] sm:px-4 sm:text-xs sm:tracking-[0.14em]',
          currentPage <= 1
            ? 'cursor-not-allowed border-border text-muted/40'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        )}
      >
        {isRail ? t.credits.prev : (
          <>
            <span className="sm:hidden">{t.credits.prev}</span>
            <span className="hidden sm:inline">{t.credits.previous}</span>
          </>
        )}
      </button>

      <div
        className={cn(
          'flex min-w-0 flex-nowrap items-center',
          isRail ? 'gap-0.5' : 'justify-center gap-1 sm:gap-2',
        )}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-label={interpolate(t.a11y.page, { n: pageNum })}
            aria-current={pageNum === currentPage ? 'page' : undefined}
            className={cn(
              'font-heading flex shrink-0 items-center justify-center border tracking-[0.08em] transition-colors',
              isRail
                ? 'h-6 min-w-6 px-1 text-[10px]'
                : 'h-8 min-w-8 px-2 text-[11px] sm:h-9 sm:min-w-9 sm:text-xs',
              pageNum === currentPage
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted hover:border-primary hover:text-primary',
            )}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={t.a11y.nextPage}
        className={cn(
          'font-heading shrink-0 border uppercase transition-colors',
          isRail
            ? 'px-1.5 py-1 text-[9px] tracking-[0.08em]'
            : 'px-2.5 py-2 text-[10px] tracking-[0.1em] sm:px-4 sm:text-xs sm:tracking-[0.14em]',
          currentPage >= totalPages
            ? 'cursor-not-allowed border-border text-muted/40'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        )}
      >
        {t.credits.next}
      </button>
    </nav>
  )
}

function PressCard({
  item,
  mirror,
  className,
}: {
  item: PressItem
  mirror?: boolean
  className?: string
}) {
  const { lang, t } = useLanguage()
  const link = pressAnchorProps(item)
  const cta = item.pdf ? t.press.openPdf : link ? t.press.readArticle : null
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.image) && !imageFailed
  const artists = (item.projectSlugs ?? []).flatMap((slug) => {
    const project = getProjectBySlug(slug)
    return project ? [project] : []
  })
  const imageShell = cn(
    'relative w-[5.25rem] min-h-[5.75rem] shrink-0 self-stretch overflow-hidden border-r border-white/10 bg-black',
    'sm:w-[42%] sm:min-h-[10.5rem] md:w-[44%]',
    mirror && 'md:border-r-0 md:border-l',
  )

  const imageInner = showImage ? (
    <>
      <img
        src={item.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
      />
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:to-black/45',
          mirror && 'md:bg-gradient-to-l md:from-transparent md:to-black/45',
        )}
        aria-hidden
      />
    </>
  ) : (
    <img
      src="/favicon.svg"
      alt=""
      className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 object-contain sm:h-14 sm:w-14"
    />
  )

  const copy = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-3">
        <p className="font-heading text-[10px] tracking-[0.12em] text-primary sm:text-xs sm:tracking-[0.14em]">
          {item.date || item.publication}
        </p>
        <Badge variant="muted" className="w-fit shrink-0 px-1.5 pt-[3px] pb-px text-[9px] leading-none sm:px-2.5 sm:pt-1 sm:pb-[3px] sm:text-[11px]">
          {localizePressType(item.type, lang)}
        </Badge>
      </div>

      <div className="min-w-0">
        <p className="font-heading text-[0.95rem] leading-tight tracking-[0.05em] text-white transition-colors duration-500 group-hover:text-primary sm:text-xl sm:leading-normal sm:tracking-[0.06em] md:text-lg lg:text-xl">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm md:mt-0.5 md:text-xs lg:text-sm">
          {item.publication}
        </p>
      </div>

      {cta ? (
        <p className="font-heading inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-primary/80 uppercase transition-colors group-hover:text-primary">
          {cta}
          <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
        </p>
      ) : null}
    </>
  )

  const artistLinks =
    artists.length > 0 ? (
      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1">
        {artists.map((project) => (
          <Link
            key={project.slug}
            to={`/portfolio/${project.slug}`}
            className="font-heading text-[10px] tracking-[0.14em] text-primary/80 uppercase transition-colors hover:text-primary"
          >
            {project.artist}
          </Link>
        ))}
      </div>
    ) : null

  const cardClass = cn(
    'glass-card group flex h-full w-full min-w-0 flex-row items-stretch overflow-hidden p-0 transition-[transform,box-shadow,border-color] duration-700 ease-out',
    mirror && 'md:flex-row-reverse',
    (link || artists.length > 0) &&
      'card-lift hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_28px_rgba(184,255,0,0.08)]',
    className,
  )

  return (
    <div className={cardClass}>
      {link ? (
        <a {...link} tabIndex={-1} className={imageShell}>
          {imageInner}
        </a>
      ) : (
        <div className={imageShell} aria-hidden>
          {imageInner}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-2.5 sm:gap-2.5 sm:p-4 md:gap-2">
        {link ? (
          <a
            {...link}
            className="flex min-w-0 flex-col gap-1.5 focus-visible:outline-none sm:gap-2.5 md:gap-2"
          >
            {copy}
          </a>
        ) : (
          copy
        )}
        {artistLinks}
      </div>
    </div>
  )
}

type PressTimelineContextValue = {
  type: PressTypeFilter
  items: PressItem[]
  pageItems: PressItem[]
  currentPage: number
  totalPages: number
  handleTypeChange: (next: PressTypeFilter) => void
  goToPage: (next: number) => void
}

const PressTimelineContext = createContext<PressTimelineContextValue | null>(null)

function usePressTimeline() {
  const ctx = useContext(PressTimelineContext)
  if (!ctx) {
    throw new Error('PressTimeline parts must be rendered inside PressTimeline')
  }
  return ctx
}

export function PressTimelineHeader() {
  const {
    type,
    items,
    currentPage,
    totalPages,
    handleTypeChange,
    goToPage,
  } = usePressTimeline()
  const { t } = useLanguage()
  const filterLabel = (id: PressTypeFilter) => {
    if (id === 'all') return t.press.all
    if (id === 'Interview') return t.press.interviews
    if (id === 'Article') return t.press.articles
    if (id === 'Review') return t.press.reviews
    return id
  }

  return (
    <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
      <span className="metal-overlay" aria-hidden />
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
        <VuPlate className="shrink-0">{t.press.eyebrow}</VuPlate>
        <h1 className="font-heading min-w-0 text-center text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-right">
          {t.press.title}
        </h1>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div
          className="flex min-w-0 flex-wrap justify-center gap-2 sm:justify-start"
          role="tablist"
          aria-label={t.a11y.filterPress}
        >
          {TYPE_FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={type === id}
              onClick={() => handleTypeChange(id)}
              className={cn(
                'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
                type === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted hover:border-primary hover:text-primary',
              )}
            >
              {filterLabel(id)}
            </button>
          ))}
        </div>

        {items.length > PAGE_SIZE ? (
          <PressPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            label={t.a11y.pressPageTop}
            variant="rail"
            className="shrink-0"
          />
        ) : null}
      </div>
    </div>
  )
}

export function PressTimelineList({ className }: { className?: string }) {
  const { type, items, pageItems, currentPage, totalPages, goToPage } =
    usePressTimeline()
  const { t } = useLanguage()
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const container = reduced ? undefined : staggerContainer

  return (
    <div className={className}>
      <div className="relative">
        <span
          className="pointer-events-none absolute top-8 bottom-8 left-[6px] w-px -translate-x-1/2 bg-white/20 md:hidden"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute top-6 bottom-6 left-1/2 hidden w-px -translate-x-1/2 bg-white/20 md:block"
          aria-hidden
        />
        <motion.ul
          className="flex flex-col gap-2 sm:gap-3 md:gap-0"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label={t.a11y.pressList}
          key={`${type}-${currentPage}`}
        >
          {pageItems.map((pressItem, index) => {
            const alignLeft = index % 2 === 0
            return (
              <motion.li
                key={pressItem.id}
                variants={item}
                className={cn(
                  'group/press relative flex min-w-0 gap-2.5 sm:gap-4',
                  'pointer-events-none md:grid md:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] md:items-start md:gap-x-4',
                  !alignLeft && 'md:-mt-20 lg:-mt-24',
                )}
                style={{ zIndex: index + 1 }}
              >
                <div className="relative w-3 shrink-0 md:hidden" aria-hidden>
                  <span className="absolute top-8 left-1/2 z-10 flex h-1.5 w-1.5 -translate-x-1/2 items-center justify-center">
                    <span className="absolute h-3 w-3 border border-white/35 transition-colors duration-500 group-hover/press:border-primary" />
                    <span className="h-1.5 w-1.5 bg-white transition-[background-color,box-shadow] duration-500 group-hover/press:bg-primary group-hover/press:shadow-[0_0_10px_rgba(184,255,0,0.55)]" />
                  </span>
                </div>

                <div className="relative z-10 hidden flex-col items-center gap-1.5 pt-5 md:col-start-2 md:row-start-1 md:flex">
                  <span
                    className="relative flex h-1.5 w-1.5 items-center justify-center"
                    aria-hidden
                  >
                    <span className="absolute h-3 w-3 border border-white/35 transition-colors duration-500 group-hover/press:border-primary" />
                    <span className="h-1.5 w-1.5 bg-white transition-[background-color,box-shadow] duration-500 group-hover/press:bg-primary group-hover/press:shadow-[0_0_10px_rgba(184,255,0,0.55)]" />
                  </span>
                  <p className="font-heading text-center text-[11px] leading-none tracking-[0.12em] text-white transition-colors duration-500 group-hover/press:text-primary">
                    {yearFromItem(pressItem)}
                  </p>
                </div>

                <div
                  className={cn(
                    'pointer-events-auto min-w-0 flex-1 md:row-start-1',
                    alignLeft ? 'md:col-start-1' : 'md:col-start-3',
                  )}
                >
                  <PressCard
                    item={pressItem}
                    mirror={!alignLeft}
                    className="min-w-0"
                  />
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">{t.press.empty}</p>
      ) : null}

      {items.length > PAGE_SIZE ? (
        <PressPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          label={t.a11y.pressPageBottom}
          className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8"
        />
      ) : null}
    </div>
  )
}

export function PressTimeline({ children }: { children?: ReactNode }) {
  const [type, setType] = useState<PressTypeFilter>('all')
  const [page, setPage] = useState(1)
  const items = getPressItems(type)
  const reduced = useReducedMotion()

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleTypeChange(next: PressTypeFilter) {
    setType(next)
    setPage(1)
  }

  function goToPage(next: number) {
    const clamped = Math.min(totalPages, Math.max(1, next))
    if (clamped === currentPage) return
    setPage(clamped)
    scrollPressSectionIntoView(reduced)
  }

  return (
    <PressTimelineContext.Provider
      value={{
        type,
        items,
        pageItems,
        currentPage,
        totalPages,
        handleTypeChange,
        goToPage,
      }}
    >
      {children ?? (
        <>
          <PressTimelineHeader />
          <PressTimelineList className="mt-10" />
        </>
      )}
    </PressTimelineContext.Provider>
  )
}

PressTimeline.Header = PressTimelineHeader
PressTimeline.List = PressTimelineList
