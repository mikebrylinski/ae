import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { getSite } from '@/lib/content'
import { interpolate } from '@/i18n/ui'
import { Container } from '@/components/ui/Container'
import { PlaceholderMedia } from '@/components/ui/PlaceholderMedia'
import { MediaImage } from '@/components/ui/MediaImage'
import {
  GalleryLightbox,
  type GalleryLightboxItem,
} from '@/components/ui/GalleryLightbox'
import { CTABanner } from '@/components/sections/CTABanner'
import { PhotoHeader } from '@/components/sections/PhotoHeader'
import { VuPlate } from '@/components/ui/VuPlate'
import { VeniceVeganOverlay } from '@/components/ui/VeniceVeganOverlay'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

type ChapterImage = {
  label: string
  aspect: string
  src?: string
  place?: 'end' | 'below' | 'followUp'
  span?: 2
  showFull?: boolean
  centered?: boolean
  compact?: boolean
  tall?: boolean
  fillColumn?: boolean
  /** Short full-width crop, like a chapter header. */
  banner?: boolean
  /** Taller banner crop. */
  bannerTall?: boolean
  focus?: string
  /** Optional overlay caption on the photo. */
  caption?: string
  /** Tailwind classes for caption position (defaults near lower right). */
  captionPos?: string
}

type Chapter = {
  eyebrow: string
  from: number
  to: number
  layout: 'stack'
  copyBeside?: 'left' | 'right'
  /** Small inset thumbnails that open a lightbox instead of full-bleed photos. */
  thumbs?: boolean
  /** Float small photos into the copy so text wraps around them. */
  wrap?: boolean
  images: ChapterImage[]
}

/** Story paragraph indexes rendered as accented pull quotes. */
const PULL_QUOTE_STORY_INDEXES = new Set([11, 14, 26])

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 5,
    layout: 'stack',
    wrap: true,
    images: [
      {
        label: "Ticket for a concert of Andy's band, The Taylors, + 2 more in West Berlin, 1987.",
        aspect: 'aspect-[4/3]',
        src: 'https://twj9hkdxnej2mgbm.public.blob.vercel-storage.com/gallery/photos/1790301069106-taylors-1987.jpg',
        focus: 'object-[18%_center]',
      },
    ],
  },
  {
    eyebrow: 'The Basement',
    from: 5,
    to: 12,
    layout: 'stack',
    wrap: true,
    images: [
      {
        label: 'Tascam mixer and Pioneer cassette deck in the basement studio',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement.jpg',
      },
      {
        label: 'Basement Studio Tascam 24ch console, Fostex G16S and more gear',
        aspect: 'aspect-[4/3]',
        src: 'https://twj9hkdxnej2mgbm.public.blob.vercel-storage.com/gallery/photos/1788831967356-img_5895.jpg',
        focus: 'object-[center_40%]',
      },
    ],
  },
  {
    eyebrow: 'On the Road',
    from: 12,
    to: 19,
    layout: 'stack',
    copyBeside: 'left',
    images: [
      {
        label: 'Andy mixing a live show from a touring console',
        aspect: 'aspect-auto',
        src: '/images/about/on-the-road-console.jpg',
        place: 'end',
        fillColumn: true,
        focus: 'object-[center_20%]',
      },
    ],
  },
  {
    eyebrow: 'On his way to LA',
    from: 19,
    to: 29,
    layout: 'stack',
    images: [
      {
        label: 'Andy in front of the Hollywood sign, Los Angeles',
        aspect: 'aspect-[2.4/1]',
        src: '/images/about/los-angeles.jpg',
        banner: true,
        bannerTall: true,
        focus: 'object-[center_35%]',
      },
    ],
  },
  {
    eyebrow: 'Worldwide',
    from: 29,
    to: 36,
    layout: 'stack',
    wrap: true,
    images: [
      {
        label: 'Puddle of Mudd crew, Jack, Elwood & Toby Francis, Lars Ide, Bus driver, Andy.',
        aspect: 'aspect-[4/3]',
        src: '/images/gallery/backstage-2.jpg',
        focus: 'object-center',
      },
      {
        label:
          'ML Procise and Andy in Tokio - sharing a console, mixing monitors from FOH for a Puddle of Mudd acoustic promo show.',
        aspect: 'aspect-[4/3]',
        src: '/images/gallery/backstage-1.jpg',
        focus: 'object-center',
      },
    ],
  },
]

function ChapterImages({ images }: { images: readonly ChapterImage[] }) {
  const many = images.length > 1

  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden',
        many &&
          (images.length === 4
            ? 'grid grid-cols-2 gap-px'
            : 'grid gap-px sm:grid-cols-2'),
        many && images.some((img) => img.showFull) && 'items-start',
        !many &&
          !images.some((img) => img.showFull || img.banner) &&
          'h-full',
      )}
    >
      {images.map((img, i) =>
        img.src ? (
          <div
            key={img.label}
            className={cn(
              'relative min-w-0',
              img.fillColumn && 'h-full min-h-0',
              img.span === 2 && 'col-span-full',
            )}
          >
            <MediaImage
              src={img.src}
              alt={img.label}
              aspect={img.banner ? '' : img.aspect}
              wrapperClassName={cn(
                'w-full rounded-none border-0',
                img.fillColumn && 'relative h-72 sm:h-80 lg:h-full lg:min-h-0',
                img.banner &&
                  (img.bannerTall
                    ? 'relative h-56 overflow-hidden sm:h-72 md:h-80 lg:h-[28rem]'
                    : 'relative h-44 overflow-hidden sm:h-56 md:h-64 lg:h-72'),
                img.showFull
                  ? 'max-h-none'
                  : img.banner || img.fillColumn
                    ? 'max-h-none'
                    : img.tall
                      ? 'max-h-72 sm:max-h-96 lg:max-h-[30rem]'
                      : 'max-h-48 sm:max-h-56 lg:max-h-64',
                img.compact && 'mx-auto w-full max-w-sm sm:max-w-md',
                img.centered && 'mx-auto max-w-md bg-black',
              )}
              fit={img.centered ? 'contain' : 'cover'}
              className={
                img.fillColumn || img.banner
                  ? cn(
                      'absolute inset-0 h-full w-full object-cover',
                      img.focus ?? 'object-[center_18%]',
                    )
                  : img.showFull
                    ? 'h-auto w-full object-contain object-center'
                    : cn('object-cover', img.focus ?? 'object-[center_35%]')
              }
              fallbackLabel={img.label}
            />
            {img.caption ? (
              <p
                className={cn(
                  'about-photo-caption font-heading pointer-events-none absolute z-[2] max-w-[14rem] border border-primary/40 bg-black/88 px-3.5 py-2.5 text-[0.78rem] leading-snug tracking-[0.1em] text-primary uppercase shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-[3px] sm:max-w-[17rem] sm:px-4 sm:py-3 sm:text-[0.88rem] md:max-w-[19rem] md:px-5 md:py-3.5 md:text-[0.95rem]',
                  img.captionPos ?? 'right-3 bottom-3',
                )}
              >
                {img.caption}
              </p>
            ) : null}
          </div>
        ) : (
          <PlaceholderMedia
            key={img.label}
            label={img.label}
            aspect={img.aspect}
            className={cn(
              'spotlight-empty-grid w-full border-0',
              !many && 'h-full',
              images.length === 3 && i === 2 && 'sm:col-span-2',
            )}
          />
        ),
      )}
    </div>
  )
}

function ChapterThumbStrip({ images }: { images: readonly ChapterImage[] }) {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const items = useMemo<GalleryLightboxItem[]>(
    () =>
      images.flatMap((img) =>
        img.src
          ? [
              {
                src: img.src,
                alt: img.label,
                caption: img.label,
              },
            ]
          : [],
      ),
    [images],
  )

  if (items.length === 0) return null

  return (
    <>
      <ul
        className={cn(
          'grid gap-2 px-4 pb-4 sm:gap-2.5 sm:px-6 sm:pb-6 md:px-8 md:pb-8',
          items.length <= 2
            ? 'w-full max-w-md grid-cols-2'
            : items.length >= 5
              ? 'w-full grid-cols-3 sm:grid-cols-5'
              : 'w-full grid-cols-2 sm:grid-cols-4',
        )}
      >
        {items.map((item, i) => {
          const focus = images.find((img) => img.src === item.src)?.focus

          return (
            <li key={item.src} className="min-w-0">
              <button
                type="button"
                className="group w-full cursor-pointer rounded-[0.75rem] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setLightboxIndex(i)}
                aria-label={interpolate(t.a11y.viewGallery, { alt: item.alt })}
              >
                <div
                  className={cn(
                    'relative aspect-[4/3] w-full overflow-hidden rounded-[0.75rem] border border-border bg-black',
                    'transition-[border-color,box-shadow] duration-300',
                    'group-hover:border-primary/40 group-hover:shadow-[0_0_16px_rgba(184,255,0,0.06)]',
                  )}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className={cn(
                      'h-full w-full object-cover',
                      focus ?? 'object-[center_35%]',
                    )}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <GalleryLightbox
        items={items}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}

function ChapterWrapFigures({
  images,
  paraCount,
  children,
}: {
  images: readonly ChapterImage[]
  paraCount: number
  children: (args: {
    startFigure: ReactNode
    endFigure: ReactNode
    endInsertAt: number
  }) => ReactNode
}) {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lightboxItems = useMemo<GalleryLightboxItem[]>(
    () =>
      images.flatMap((img) =>
        img.src
          ? [
              {
                src: img.src,
                alt: img.label,
                caption: img.label,
              },
            ]
          : [],
      ),
    [images],
  )

  const floatClass = (side: 'start' | 'end') =>
    cn(
      'mb-4 w-[58%] max-w-[24rem] overflow-hidden rounded-[0.65rem] border border-border bg-black sm:mb-5 sm:w-80 sm:max-w-none md:w-96',
      'transition-[border-color,box-shadow] duration-300',
      side === 'start' ? 'float-left mr-5 sm:mr-6' : 'float-right ml-5 sm:ml-6',
    )

  const figure = (img: ChapterImage | undefined, side: 'start' | 'end') => {
    if (!img) return null

    if (!img.src) {
      return (
        <div className={floatClass(side)}>
          <PlaceholderMedia label={img.label} aspect="aspect-[4/3]" className="w-full border-0" />
        </div>
      )
    }

    const lightboxIndexForSrc = lightboxItems.findIndex((item) => item.src === img.src)

    return (
      <button
        type="button"
        className={cn(
          floatClass(side),
          'group cursor-pointer text-left',
          'hover:border-primary/40 hover:shadow-[0_0_16px_rgba(184,255,0,0.06)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        )}
        onClick={() =>
          lightboxIndexForSrc >= 0 ? setLightboxIndex(lightboxIndexForSrc) : undefined
        }
        aria-label={interpolate(t.a11y.viewGallery, { alt: img.label })}
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden">
          <img
            src={img.src}
            alt={img.label}
            className={cn('h-full w-full object-cover', img.focus ?? 'object-[center_35%]')}
            loading="lazy"
            decoding="async"
          />
        </span>
      </button>
    )
  }

  const endInsertAt = Math.min(2, Math.max(1, paraCount - 3))

  return (
    <>
      {children({
        startFigure: figure(images[0], 'start'),
        endFigure: figure(images[1], 'end'),
        endInsertAt,
      })}
      <div className="clear-both" aria-hidden />
      <GalleryLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}

export default function AboutPage() {
  const { lang, t } = useLanguage()
  const { about } = getSite(lang)

  useSeo({
    title: t.about.seoTitle,
    description: t.about.seoDescription,
  })

  return (
    <>
      <PhotoHeader
        src="/images/about/berlin.jpg"
        alt={t.about.headerAlt}
        heading={t.about.pageHeadline}
      >
        <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
          <span className="metal-overlay" aria-hidden />
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
            <VuPlate className="shrink-0">{t.about.eyebrow}</VuPlate>
            <h1 className="font-heading min-w-0 text-center text-xl tracking-[0.06em] text-white sm:text-2xl md:text-right md:text-3xl">
              {t.about.pageHeadline.includes(t.about.pageHeadlineAccent) ? (
                <>
                  {t.about.pageHeadline.split(t.about.pageHeadlineAccent)[0]}
                  <span className="text-primary">{t.about.pageHeadlineAccent}</span>
                </>
              ) : (
                t.about.pageHeadline
              )}
            </h1>
          </div>
        </div>
      </PhotoHeader>

      <section className="section-divider-top bg-black pt-8 pb-16 sm:pt-10 sm:pb-20 md:pt-12 md:pb-24 lg:pb-28">
        <Container>
          <div className="space-y-8 md:space-y-10">
            {CHAPTERS.map((chapter, chapterIndex) => {
              const localized = t.about.chapters[chapterIndex]
              const paras = about.story.slice(chapter.from, chapter.to)
              const images = chapter.images.map((img, i) => ({
                ...img,
                label: localized?.alts[i] ?? img.label,
              }))
              const topImages = chapter.wrap
                ? []
                : images.filter((img) => !img.place)
              const endImages = chapter.wrap
                ? []
                : images.filter((img) => img.place === 'end')
              const belowImages = chapter.wrap
                ? []
                : images.filter((img) => img.place === 'below')
              const followUpImages = chapter.wrap
                ? []
                : images.filter((img) => img.place === 'followUp')

              const renderStoryParas = ({
                startFigure,
                endFigure,
                endInsertAt,
              }: {
                startFigure?: ReactNode
                endFigure?: ReactNode
                endInsertAt?: number
              } = {}) => (
                <div
                  className={cn(
                    'min-w-0 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:text-[0.98rem] md:leading-[1.8]',
                    chapter.wrap ? undefined : 'space-y-5 md:space-y-6',
                  )}
                >
                  {startFigure}
                  {paras.map((p, i) => {
                    const storyIndex = chapter.from + i
                    const insertEnd = endFigure && endInsertAt === i
                    const body =
                      PULL_QUOTE_STORY_INDEXES.has(storyIndex) ? (
                        <blockquote
                          className={cn(
                            'about-pull-quote relative overflow-hidden rounded-none border border-primary/25 px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-7',
                            chapter.wrap ? 'my-3 sm:my-4' : 'my-3 sm:my-4',
                          )}
                        >
                          <span className="about-pull-quote__glow" aria-hidden />
                          <p className="font-heading relative z-[1] text-sm leading-relaxed tracking-[0.03em] text-foreground !font-normal sm:text-[0.95rem] sm:leading-relaxed md:text-base md:leading-[1.65]">
                            {p}
                          </p>
                          <span
                            className="pointer-events-none absolute right-0 bottom-0 z-[1] h-px w-1/3 bg-gradient-to-l from-transparent to-primary/50"
                            aria-hidden
                          />
                        </blockquote>
                      ) : (
                        <p className={chapter.wrap ? 'mb-5 md:mb-6' : undefined}>{p}</p>
                      )

                    return (
                      <Fragment key={`${p.slice(0, 36)}-${i}`}>
                        {insertEnd ? endFigure : null}
                        {body}
                      </Fragment>
                    )
                  })}
                </div>
              )

              const copyBody = chapter.wrap ? (
                <ChapterWrapFigures images={images} paraCount={paras.length}>
                  {({ startFigure, endFigure, endInsertAt }) =>
                    renderStoryParas({ startFigure, endFigure, endInsertAt })
                  }
                </ChapterWrapFigures>
              ) : (
                renderStoryParas()
              )

              const copy = (
                <div
                  className={cn(
                    'flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12',
                    chapter.thumbs && 'pb-4 sm:pb-5 md:pb-6',
                  )}
                >
                  <div className="mb-5 flex min-w-0 flex-col items-start gap-2">
                    <VuPlate className="max-w-full shrink-0">
                      {localized?.eyebrow ?? chapter.eyebrow}
                    </VuPlate>
                    {localized?.dek ? (
                      <p className="font-heading min-w-0 text-base tracking-[0.04em] text-primary italic !font-light sm:text-lg">
                        {localized.dek}
                      </p>
                    ) : null}
                  </div>
                  {copyBody}
                </div>
              )

              const copyOnRight = chapter.copyBeside === 'right'
              const copyOnLeft = chapter.copyBeside === 'left'

              return (
                <Fragment key={chapter.eyebrow}>
                  <article className="glass-card overflow-hidden p-0">
                    {chapter.thumbs ? (
                      <>
                        {copy}
                        <ChapterThumbStrip images={images} />
                      </>
                    ) : (
                      <>
                        {topImages.length > 0 ? (
                          <ChapterImages images={topImages} />
                        ) : null}
                        {copyOnRight && endImages.length > 0 ? (
                          <div className="grid lg:grid-cols-2 lg:items-stretch">
                            <div className="order-1 h-72 min-h-0 min-w-0 overflow-hidden sm:h-80 lg:h-auto">
                              <ChapterImages images={endImages} />
                            </div>
                            <div className="order-2 min-w-0">{copy}</div>
                          </div>
                        ) : copyOnLeft && endImages.length > 0 ? (
                          <div className="grid lg:grid-cols-2 lg:items-stretch">
                            <div className="order-2 min-w-0 lg:order-1">{copy}</div>
                            <div className="order-1 h-72 min-h-0 min-w-0 overflow-hidden sm:h-80 lg:order-2 lg:h-auto">
                              <ChapterImages images={endImages} />
                            </div>
                          </div>
                        ) : (
                          <>
                            {copy}
                            {endImages.length > 0 ? (
                              <ChapterImages images={endImages} />
                            ) : null}
                          </>
                        )}
                        {belowImages.length > 0 ? (
                          <ChapterImages images={belowImages} />
                        ) : null}
                      </>
                    )}
                  </article>
                  {followUpImages.length > 0 ? (
                    <article className="glass-card overflow-hidden p-0">
                      <ChapterImages images={followUpImages} />
                    </article>
                  ) : null}
                </Fragment>
              )
            })}

            <article className="glass-card grid overflow-hidden p-0 lg:grid-cols-2 lg:items-stretch">
              <div className="order-2 flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12 lg:order-1">
                <div className="mb-5 flex min-w-0 flex-col items-start gap-2">
                  <VuPlate className="max-w-full shrink-0">{t.about.venice.plate}</VuPlate>
                  <div className="min-w-0 space-y-1">
                    <p className="font-heading text-base tracking-[0.04em] text-primary italic !font-light sm:text-lg">
                      {t.about.venice.eyebrow}
                    </p>
                    <p className="font-heading text-base tracking-[0.04em] text-primary italic !font-light sm:text-lg">
                      {t.about.venice.dek}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 space-y-5 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:space-y-6 md:text-[0.98rem] md:leading-[1.8]">
                  {t.about.venice.paragraphs.map((p) => (
                    <p key={p.slice(0, 36)}>{p}</p>
                  ))}
                  <p>
                    {t.about.venice.plantDietBefore}
                    <a
                      href={t.about.venice.plantDietHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                    >
                      {t.about.venice.plantDietLink}
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="relative order-1 min-h-[18rem] overflow-hidden sm:min-h-[28rem] lg:order-2 lg:min-h-full">
                <MediaImage
                  src="/images/about/venice.jpg"
                  alt={t.about.venice.headerAlt}
                  aspect="aspect-[3/2]"
                  wrapperClassName="relative h-full min-h-[18rem] w-full rounded-none border-0 sm:min-h-[28rem] lg:absolute lg:inset-0 lg:min-h-full"
                  fit="cover"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  fallbackLabel={t.about.venice.plate}
                />
                <VeniceVeganOverlay />
              </div>
            </article>
          </div>

          {about.next ? (
            <p className="font-heading mt-12 text-center text-xs tracking-[0.12em] text-primary sm:mt-16 sm:text-sm">
              {about.next}
            </p>
          ) : null}
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
