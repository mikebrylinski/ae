import { Fragment } from 'react'
import { getSite } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { PlaceholderMedia } from '@/components/ui/PlaceholderMedia'
import { MediaImage } from '@/components/ui/MediaImage'
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
  focus?: string
}

type Chapter = {
  eyebrow: string
  from: number
  to: number
  layout: 'stack'
  copyBeside?: 'left' | 'right'
  images: ChapterImage[]
}

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 5,
    layout: 'stack',
    images: [
      {
        label: 'West Berlin basement studio with a mixing console, CRT, and NS-10s',
        aspect: 'aspect-[2.4/1]',
        src: '/images/about/west-berlin-header.jpg',
        banner: true,
        focus: 'object-[70%_bottom]',
      },
    ],
  },
  {
    eyebrow: 'The Basement',
    from: 5,
    to: 12,
    layout: 'stack',
    copyBeside: 'right',
    images: [
      {
        label: 'Tascam mixer and Pioneer cassette deck in the basement studio',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement.jpg',
      },
      {
        label: 'Andy at a mixing console with a friend in a basement venue',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement-crew.jpg',
        focus: 'object-[center_35%]',
      },
      {
        label: 'Bell analog mixer on the basement workbench',
        aspect: 'aspect-auto',
        src: '/images/about/basement-bell.jpg',
        place: 'end',
        fillColumn: true,
        focus: 'object-[center_55%]',
      },
      {
        label: 'Mixing console and Yamaha NS-10 in the basement studio',
        aspect: 'aspect-[4/3]',
        src: '/images/about/basement-ns10.jpg',
        place: 'below',
        tall: true,
        span: 2,
        focus: 'object-[center_45%]',
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
        tall: true,
        focus: 'object-[22%_top]',
      },
      {
        label: 'Andy mixing a live show from a touring console',
        aspect: 'aspect-auto',
        src: '/images/about/on-the-road-console.jpg',
        place: 'end',
        fillColumn: true,
        focus: 'object-[72%_center]',
      },
      {
        label: 'Mixing FOH at an outdoor concert',
        aspect: 'aspect-[4/3]',
        src: '/images/about/on-the-road-foh.jpg',
        place: 'below',
        tall: true,
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
        label: 'Andy in front of the Hollywood sign, Los Angeles',
        aspect: 'aspect-[4/3]',
        src: '/images/about/los-angeles.jpg',
        tall: true,
      },
      {
        label: 'Tonight Show with Jay Leno and Welcome to California signs on a studio lot',
        aspect: 'aspect-[4/3]',
        src: '/images/about/los-angeles-tonight-show.jpg',
        tall: true,
        focus: 'object-[center_40%]',
      },
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
        many && 'grid gap-px sm:grid-cols-2',
        many && images.some((img) => img.showFull) && 'items-start',
        !many &&
          !images.some((img) => img.showFull || img.banner) &&
          'h-full',
      )}
    >
      {images.map((img, i) =>
        img.src ? (
          <MediaImage
            key={img.label}
            src={img.src}
            alt={img.label}
            aspect={img.banner ? '' : img.aspect}
            wrapperClassName={cn(
              'w-full rounded-none border-0',
              img.fillColumn && 'relative h-72 sm:h-80 lg:h-full lg:min-h-0',
              img.banner && 'relative h-44 overflow-hidden sm:h-56 md:h-64 lg:h-72',
              img.showFull
                ? 'max-h-none'
                : img.banner || img.fillColumn
                  ? 'max-h-none'
                  : img.tall
                    ? 'max-h-72 sm:max-h-96 lg:max-h-[30rem]'
                    : 'max-h-48 sm:max-h-56 lg:max-h-64',
              img.span === 2 && 'col-span-full',
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
                <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
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
