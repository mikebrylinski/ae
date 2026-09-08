import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  filterGallery,
  getGalleryArtistTags,
  getGallerySceneTags,
  getGalleryYearTags,
  localizeCategory,
  type GallerySort,
} from '@/lib/content'
import { interpolate } from '@/i18n/ui'
import { useLanguage } from '@/i18n/LanguageProvider'
import { MediaImage } from '@/components/ui/MediaImage'
import { FilterAccordion } from '@/components/ui/FilterAccordion'
import { VuPlate } from '@/components/ui/VuPlate'
import { GalleryPager, GALLERY_PAGE_SIZE } from '@/components/ui/GalleryPager'
import { cn } from '@/lib/utils'
import { GALLERY_UPDATED_EVENT, loadStoredExtraTags } from '@/lib/galleryAdmin'
import { galleryObjectPosition } from '@/lib/galleryFocal'
import { useLiveGallery } from '@/hooks/useLiveGallery'
import type { GalleryItem } from '@/types'

const SORTS: GallerySort[] = ['order', 'newest', 'oldest', 'tag']

function Chip({
  label,
  selected,
  onClick,
  size = 'md',
}: {
  label: string
  selected: boolean
  onClick: () => void
  size?: 'md' | 'sm'
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'font-heading border uppercase transition-colors',
        size === 'md'
          ? 'px-4 py-2 text-xs tracking-[0.14em]'
          : 'px-3 py-1.5 text-[11px] tracking-[0.12em]',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted hover:border-primary hover:text-primary',
      )}
    >
      {label}
    </button>
  )
}

function TagGroup({
  label,
  tags,
  selected,
  onToggle,
  localize,
  size = 'md',
  collapsible,
  showLabel,
  hideLabel,
}: {
  label: string
  tags: string[]
  selected: string[]
  onToggle: (tag: string) => void
  localize?: (tag: string) => string
  size?: 'md' | 'sm'
  collapsible?: boolean
  showLabel?: string
  hideLabel?: string
}) {
  const hasActive = tags.some((tag) => selected.includes(tag))
  const [open, setOpen] = useState(!collapsible || hasActive)

  if (tags.length === 0) return null

  const expanded = !collapsible || open || hasActive

  return (
    <div className="text-center md:text-left">
      {collapsible ? (
        <button
          type="button"
          className="font-heading mb-2 text-[10px] tracking-[0.16em] text-muted uppercase hover:text-primary"
          aria-expanded={expanded}
          onClick={() => setOpen((current) => !current)}
        >
          {label}
          <span className="ml-2 text-primary">
            {expanded ? hideLabel : showLabel}
          </span>
        </button>
      ) : (
        <p className="font-heading mb-2 text-[10px] tracking-[0.16em] text-muted uppercase">
          {label}
        </p>
      )}
      {expanded ? (
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={localize ? localize(tag) : tag}
              selected={selected.includes(tag)}
              onClick={() => onToggle(tag)}
              size={size}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type GalleryGridContextValue = {
  items: GalleryItem[]
  pagedItems: GalleryItem[]
  sourceItems: GalleryItem[]
  selected: string[]
  sort: GallerySort
  page: number
  pageCount: number
  lightboxIndex: number | null
  setLightboxIndex: (index: number | null) => void
  setPage: (page: number) => void
  toggleTag: (tag: string) => void
  clearTags: () => void
  setSort: (sort: GallerySort) => void
}

const GalleryGridContext = createContext<GalleryGridContextValue | null>(null)

function useGalleryGrid() {
  const ctx = useContext(GalleryGridContext)
  if (!ctx) {
    throw new Error('GalleryGrid parts must be rendered inside GalleryGrid')
  }
  return ctx
}

export function GalleryGridHeader() {
  const { items, sourceItems, selected, sort, toggleTag, clearTags, setSort } =
    useGalleryGrid()
  const { lang, t } = useLanguage()
  const [extraTags, setExtraTags] = useState(loadStoredExtraTags)

  useEffect(() => {
    const sync = () => setExtraTags(loadStoredExtraTags())
    window.addEventListener(GALLERY_UPDATED_EVENT, sync)
    return () => window.removeEventListener(GALLERY_UPDATED_EVENT, sync)
  }, [])

  const artistTags = useMemo(
    () => getGalleryArtistTags(sourceItems, extraTags),
    [sourceItems, extraTags],
  )
  const sceneTags = useMemo(
    () => getGallerySceneTags(sourceItems, extraTags),
    [sourceItems, extraTags],
  )
  const yearTags = useMemo(
    () => getGalleryYearTags(sourceItems),
    [sourceItems],
  )

  function sortLabel(value: GallerySort) {
    if (value === 'order') return t.galleryPage.order
    if (value === 'newest') return t.galleryPage.newest
    if (value === 'oldest') return t.galleryPage.oldest
    return t.galleryPage.tagAz
  }

  return (
    <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
      <span className="metal-overlay" aria-hidden />
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
        <VuPlate className="shrink-0">{t.galleryPage.heading}</VuPlate>
        <div className="min-w-0 text-center md:text-right">
          <h1 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
            {t.galleryPage.title}
          </h1>
          <p className="mt-2 font-heading text-[11px] tracking-[0.14em] text-primary uppercase">
            {interpolate(t.galleryPage.count, { n: items.length })}
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted md:mt-8">
        {t.galleryPage.intro}
      </p>

      <FilterAccordion
        className="mt-8 sm:mt-10"
        label={t.galleryPage.filters}
        toggleLabel={t.a11y.toggleFilters}
        summary={
          selected.length > 0
            ? interpolate(t.galleryPage.filtersSelected, {
                n: selected.length,
              })
            : undefined
        }
      >
        <div className="space-y-6" role="group" aria-label={t.a11y.filterGallery}>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Chip
              label={localizeCategory('All', lang)}
              selected={selected.length === 0}
              onClick={clearTags}
            />
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={clearTags}
                className="font-heading px-2 text-[11px] tracking-[0.14em] text-primary uppercase hover:opacity-80"
              >
                {t.galleryPage.clear}
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-8 md:items-start">
            <TagGroup
              label={t.galleryPage.artistLabel}
              tags={artistTags}
              selected={selected}
              onToggle={toggleTag}
              size="sm"
            />
            <TagGroup
              label={t.galleryPage.sceneLabel}
              tags={sceneTags}
              selected={selected}
              onToggle={toggleTag}
              localize={(tag) => localizeCategory(tag, lang)}
            />
            <TagGroup
              label={t.galleryPage.yearLabel}
              tags={yearTags}
              selected={selected}
              onToggle={toggleTag}
              size="sm"
            />
            <div role="group" aria-label={t.a11y.sortGallery}>
              <p className="font-heading mb-2 text-center text-[10px] tracking-[0.16em] text-muted uppercase md:text-left">
                {t.galleryPage.sortLabel}
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {SORTS.map((value) => (
                  <Chip
                    key={value}
                    label={sortLabel(value)}
                    selected={sort === value}
                    onClick={() => setSort(value)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </FilterAccordion>
    </div>
  )
}

export function GalleryGridMasonry() {
  const { items, pagedItems, page, pageCount, setPage, setLightboxIndex } =
    useGalleryGrid()
  const { t } = useLanguage()

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-[18rem] items-center justify-center border border-border sm:min-h-[22rem]"
        role="status"
        aria-live="polite"
      >
        <p className="font-heading px-6 text-center text-xs tracking-[0.14em] text-muted uppercase">
          {t.galleryPage.empty}
        </p>
      </div>
    )
  }

  const rangeStart = (page - 1) * GALLERY_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * GALLERY_PAGE_SIZE, items.length)

  function goToPage(next: number, scroll = false) {
    setPage(next)
    setLightboxIndex(null)
    if (scroll) {
      document.getElementById('gallery-photos')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <div id="gallery-photos" className="scroll-mt-32 space-y-6 md:scroll-mt-40">
      {pageCount > 1 ? (
        <div className="space-y-3">
          <p className="font-heading text-center text-[11px] tracking-[0.14em] text-muted uppercase">
            {interpolate(t.galleryPage.range, {
              start: rangeStart,
              end: rangeEnd,
              n: items.length,
            })}
          </p>
          <GalleryPager
            page={page}
            pageCount={pageCount}
            label={t.galleryPage.pagesTop}
            prevLabel={t.credits.prev}
            nextLabel={t.credits.next}
            prevAria={t.a11y.prevPage}
            nextAria={t.a11y.nextPage}
            onPage={(next) => goToPage(next)}
          />
        </div>
      ) : null}

      <ul className="grid grid-cols-1 items-start gap-x-3 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pagedItems.map((item, index) => (
          <GalleryTile
            key={item.id}
            item={item}
            eager={index < 8}
            onOpen={() =>
              setLightboxIndex((page - 1) * GALLERY_PAGE_SIZE + index)
            }
          />
        ))}
      </ul>

      {pageCount > 1 ? (
        <GalleryPager
          page={page}
          pageCount={pageCount}
          label={t.galleryPage.pagesBottom}
          prevLabel={t.credits.prev}
          nextLabel={t.credits.next}
          prevAria={t.a11y.prevPage}
          nextAria={t.a11y.nextPage}
          onPage={(next) => goToPage(next, true)}
        />
      ) : null}
    </div>
  )
}

export function GalleryGrid({ children }: { children?: ReactNode }) {
  const sourceItems = useLiveGallery()
  const [selected, setSelected] = useState<string[]>([])
  const [sort, setSort] = useState<GallerySort>('order')
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const items = useMemo(
    () => filterGallery(selected, sort, sourceItems),
    [selected, sort, sourceItems],
  )

  const pageCount = Math.max(1, Math.ceil(items.length / GALLERY_PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedItems = items.slice(
    (safePage - 1) * GALLERY_PAGE_SIZE,
    safePage * GALLERY_PAGE_SIZE,
  )

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  function toggleTag(tag: string) {
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    )
    setPage(1)
    setLightboxIndex(null)
  }

  function clearTags() {
    setSelected([])
    setPage(1)
    setLightboxIndex(null)
  }

  function handleSort(next: GallerySort) {
    setSort(next)
    setPage(1)
    setLightboxIndex(null)
  }

  return (
    <GalleryGridContext.Provider
      value={{
        items,
        pagedItems,
        sourceItems,
        selected,
        sort,
        page: safePage,
        pageCount,
        lightboxIndex,
        setLightboxIndex,
        setPage,
        toggleTag,
        clearTags,
        setSort: handleSort,
      }}
    >
      {children ?? (
        <>
          <GalleryGridHeader />
          <GalleryGridMasonry />
        </>
      )}
    </GalleryGridContext.Provider>
  )
}

GalleryGrid.Header = GalleryGridHeader
GalleryGrid.Masonry = GalleryGridMasonry

export function useGalleryLightbox() {
  const { items, lightboxIndex, setLightboxIndex } = useGalleryGrid()
  return { items, lightboxIndex, setLightboxIndex }
}

function GalleryTile({
  item,
  eager,
  onOpen,
}: {
  item: GalleryItem
  eager: boolean
  onOpen: () => void
}) {
  const { lang } = useLanguage()
  const { selected, toggleTag } = useGalleryGrid()
  const caption = (item.caption || item.alt).trim()
  const tags = item.tags.filter(Boolean)

  return (
    <li className="w-full">
      <button
        type="button"
        className="group relative w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={onOpen}
        aria-label={item.alt}
      >
        <span className="relative block overflow-hidden rounded-[1rem] border border-border bg-black transition-[border-color,box-shadow] duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]">
          <MediaImage
            src={item.src}
            alt={item.alt}
            aspect="aspect-[4/3]"
            width={item.width}
            height={item.height}
            decoding="async"
            loading={eager ? 'eager' : 'lazy'}
            fallbackLabel={item.category}
            wrapperClassName="border-0 bg-black"
            style={{ objectPosition: galleryObjectPosition(item.focalX, item.focalY) }}
          />
          {caption ? (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black px-3 py-2 text-center font-heading text-[11px] leading-snug tracking-[0.04em] text-white">
              <span className="line-clamp-2">{caption}</span>
            </span>
          ) : null}
        </span>
      </button>
      {tags.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap justify-center gap-1">
          {tags.map((tag) => {
            const active = selected.includes(tag)
            return (
              <li key={tag}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'font-heading border px-2 py-1 text-[10px] tracking-[0.1em] uppercase transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  {localizeCategory(tag, lang)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}
