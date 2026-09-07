import { Fragment, useMemo, useState } from 'react'
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
  focus?: string
}

type Chapter = {
  eyebrow: string
  from: number
  to: number
  layout: 'stack'
  copyBeside?: 'left' | 'right'
  /** Small inset thumbnails that open a lightbox instead of full-bleed photos. */
  thumbs?: boolean
  images: ChapterImage[]
}

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 5,
    layout: 'stack',
    copyBeside: 'right',
    images: [
      {
        label: 'Overhead Polaroids of young Andy at a keyboard, a studio microphone, and mixing gear on a console',
        aspect: 'aspect-auto',
        src: '/images/about/west-berlin-polaroid.jpg',
        place: 'end',
        fillColumn: true,
        focus: 'object-center',
      },
    ],
  },
  {
    eyebrow: 'The Basement',
    from: 5,
    to: 12,
    layout: 'stack',
    thumbs: true,
    images: [
      {
        label: 'Tascam mixer and Pioneer cassette deck in the basement studio',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement.jpg',
      },
      {
        label: 'Andy mixing a live show beside rack cases',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement-live.jpg',
        focus: 'object-[center_30%]',
      },
      {
        label: 'Andy at a mixing console with a friend in a basement venue',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement-crew.jpg',
      },
      {
        label: 'Basement studio with mixing desk, NS-10s, and a CRT workstation',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement-workstation.jpg',
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
        label: 'Andy at a Midas Heritage console on tour',
        aspect: 'aspect-[4/3]',
        src: '/images/about/on-the-road.jpg',
        place: 'followUp',
        showFull: true,
        focus: 'object-[22%_top]',
      },
      {
        label: 'Andy mixing a live show from a touring console',
        aspect: 'aspect-auto',
        src: '/images/about/on-the-road-console.jpg',
        place: 'end',
        fillColumn: true,
        focus: 'object-[center_20%]',
      },
      {
        label: 'Mixing FOH at an outdoor concert',
        aspect: 'aspect-[4/3]',
        src: '/images/about/on-the-road-foh.jpg',
        place: 'followUp',
        showFull: true,
      },
      {
        label: 'Andy in front of the Hollywood sign, Los Angeles',
        aspect: 'aspect-[4/3]',
        src: '/images/about/los-angeles.jpg',
        place: 'followUp',
        showFull: true,
      },
      {
        label: 'Andy with touring crew behind a mixing console',
        aspect: 'aspect-[4/3]',
        src: '/images/about/west-berlin.jpg',
        place: 'followUp',
        showFull: true,
        focus: 'object-center',
      },
    ],
  },
  {
    eyebrow: 'Los Angeles',
    from: 19,
    to: 27,
    layout: 'stack',
    copyBeside: 'right',
    images: [
      {
        label: 'Alanis Morissette performing on stage',
        aspect: 'aspect-auto',
        src: '/images/projects/alanis-stage.jpg',
        place: 'end',
        fillColumn: true,
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
        !many && 'h-full',
      )}
    >
      {images.map((img, i) =>
        img.src ? (
          <MediaImage
            key={img.label}
            src={img.src}
            alt={img.label}
            aspect={img.aspect}
            wrapperClassName={cn(
              'w-full rounded-none border-0',
              img.fillColumn && 'relative h-72 sm:h-80 lg:h-full lg:min-h-0',
              img.showFull
                ? 'max-h-none'
                : img.tall
                  ? 'max-h-72 sm:max-h-96 lg:max-h-[30rem]'
                  : img.fillColumn
                    ? 'max-h-none'
                    : 'max-h-48 sm:max-h-56 lg:max-h-64',
              img.span === 2 && 'col-span-full',
              img.compact && 'mx-auto w-full max-w-sm sm:max-w-md',
              img.centered && 'mx-auto max-w-md bg-black',
            )}
            fit={img.centered ? 'contain' : 'cover'}
            className={
              img.fillColumn
                ? cn(
                    'absolute inset-0 h-full w-full object-cover',
                    img.focus ?? 'object-[center_18%]',
                  )
                : img.showFull
                  ? 'object-cover object-center'
                  : cn('object-cover', img.focus ?? 'object-[center_35%]')
            }
            fallbackLabel={img.label}
          />
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
          'grid w-full gap-2 px-4 pb-4 sm:gap-2.5 sm:px-6 sm:pb-6 md:px-8 md:pb-8',
          items.length >= 5
            ? 'grid-cols-3 sm:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-4',
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
        heading={about.headline ?? t.about.seoTitle}
      >
        <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
          <span className="metal-overlay" aria-hidden />
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
            <VuPlate className="shrink-0">{t.about.eyebrow}</VuPlate>
            <h1 className="font-heading min-w-0 text-center text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-right">
              {about.headline ?? 'Andy Ebert'}
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
              const topImages = images.filter((img) => !img.place)
              const endImages = images.filter((img) => img.place === 'end')
              const belowImages = images.filter((img) => img.place === 'below')
              const followUpImages = images.filter((img) => img.place === 'followUp')
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
                  <div className="min-w-0 space-y-5 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:space-y-6 md:text-[0.98rem] md:leading-[1.8]">
                    {paras.map((p) => (
                      <p key={p.slice(0, 36)}>{p}</p>
                    ))}
                  </div>
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
                      <ChapterImages images={topImages} />
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
                </div>
              </div>
              <div className="order-1 relative h-72 min-h-0 min-w-0 overflow-hidden sm:h-80 lg:order-2 lg:h-auto">
                <MediaImage
                  src="/images/about/venice.jpg"
                  alt={t.about.venice.headerAlt}
                  aspect="aspect-[3/2]"
                  wrapperClassName="relative h-full min-h-0 w-full rounded-none border-0"
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
