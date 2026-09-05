import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createGalleryShuffleSeed,
  filterGallery,
  GALLERY_SCENE_TAGS,
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
import { cn } from '@/lib/utils'
import type { GalleryItem } from '@/types'

const SORTS: GallerySort[] = ['shuffle', 'newest', 'oldest', 'tag']
const SCENE_TAG_SET = new Set<string>(GALLERY_SCENE_TAGS)

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
  selected: string[]
  sort: GallerySort
  lightboxIndex: number | null
  setLightboxIndex: (index: number | null) => void
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
  const { items, selected, sort, toggleTag, clearTags, setSort } =
    useGalleryGrid()
  const { lang, t } = useLanguage()
  const artistTags = useMemo(() => getGalleryArtistTags(), [])
  const sceneTags = useMemo(() => getGallerySceneTags(), [])
  const yearTags = useMemo(() => getGalleryYearTags(), [])

  function sortLabel(value: GallerySort) {
    if (value === 'shuffle') return t.galleryPage.shuffle
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
  const { items, setLightboxIndex } = useGalleryGrid()
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

  return (
    <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {items.map((item, index) => (
        <GalleryTile
          key={item.id}
          item={item}
          eager={index < 8}
          onOpen={() => setLightboxIndex(index)}
        />
      ))}
    </ul>
  )
}

export function GalleryGrid({ children }: { children?: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([])
  const [sort, setSort] = useState<GallerySort>('shuffle')
  const [shuffleSeed, setShuffleSeed] = useState(createGalleryShuffleSeed)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const items = useMemo(
    () => filterGallery(selected, sort, shuffleSeed),
    [selected, sort, shuffleSeed],
  )

  function toggleTag(tag: string) {
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    )
    setLightboxIndex(null)
  }

  function clearTags() {
    setSelected([])
    setLightboxIndex(null)
  }

  function handleSort(next: GallerySort) {
    if (next === 'shuffle') setShuffleSeed(createGalleryShuffleSeed())
    setSort(next)
    setLightboxIndex(null)
  }

  return (
    <GalleryGridContext.Provider
      value={{
        items,
        selected,
        sort,
        lightboxIndex,
        setLightboxIndex,
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
  const caption = item.tags.filter((tag) => SCENE_TAG_SET.has(tag)).slice(0, 2)

  const ratio = item.width > 0 && item.height > 0 ? `${item.width} / ${item.height}` : undefined

  return (
    <li className="mb-4 w-full break-inside-avoid">
      <button
        type="button"
        className="group w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={onOpen}
        aria-label={item.alt}
      >
        <MediaImage
          src={item.src}
          alt={item.alt}
          aspect=""
          width={item.width}
          height={item.height}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          fallbackLabel={item.category}
          className="absolute inset-0 rounded-[1rem]"
          wrapperClassName="isolate w-full overflow-hidden rounded-[1rem] border border-border transition-[border-color,box-shadow] duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
          wrapperStyle={ratio ? { aspectRatio: ratio } : undefined}
        />
        {caption.length > 0 ? (
          <p className="font-heading mt-2 text-[10px] tracking-[0.14em] text-muted uppercase">
            {caption.join(' · ')}
            {item.year ? ` · ${item.year}` : ''}
          </p>
        ) : null}
      </button>
    </li>
  )
}
