import { getSite } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { PlaceholderMedia } from '@/components/ui/PlaceholderMedia'
import { MediaImage } from '@/components/ui/MediaImage'
import { CTABanner } from '@/components/sections/CTABanner'
import { VeniceMap } from '@/components/sections/VeniceMap'
import { PhotoHeader } from '@/components/sections/PhotoHeader'
import { VuPlate } from '@/components/ui/VuPlate'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

type ChapterImage = {
  label: string
  aspect: string
  src?: string
  place?: 'end'
  span?: 2
  showFull?: boolean
  centered?: boolean
  tall?: boolean
  fillColumn?: boolean
  focus?: string
}

type Chapter = {
  eyebrow: string
  from: number
  to: number
  layout: 'stack'
  copyBeside?: 'right'
  images: ChapterImage[]
}

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 4,
    layout: 'stack',
    images: [
      {
        label: 'Young Andy at a mixing console in West Berlin',
        aspect: 'aspect-[16/9]',
        src: '/images/about/west-berlin.jpg',
      },
    ],
  },
  {
    eyebrow: 'The basement',
    from: 4,
    to: 7,
    layout: 'stack',
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
      },
    ],
  },
  {
    eyebrow: 'On the road',
    from: 7,
    to: 10,
    layout: 'stack',
    images: [
      {
        label: 'Andy at a Midas Heritage console on tour',
        aspect: 'aspect-[4/3]',
        src: '/images/about/on-the-road.jpg',
        tall: true,
        focus: 'object-[22%_top]',
      },
      {
        label: 'Mixing FOH at an outdoor concert',
        aspect: 'aspect-[4/3]',
        src: '/images/about/on-the-road-foh.jpg',
        place: 'end',
        tall: true,
      },
    ],
  },
  {
    eyebrow: 'Los Angeles',
    from: 10,
    to: 12,
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
              img.centered && 'mx-auto max-w-md bg-black',
            )}
            fit={img.centered ? 'contain' : 'cover'}
            className={
              img.fillColumn
                ? 'absolute inset-0 h-full w-full object-cover object-[center_18%]'
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

      <section className="section-divider-top bg-black py-16 sm:py-20 md:py-24 lg:py-28">
        <Container>
          <div className="space-y-8 md:space-y-10">
            {CHAPTERS.map((chapter, chapterIndex) => {
              const localized = t.about.chapters[chapterIndex]
              const paras = about.story.slice(chapter.from, chapter.to)
              const images = chapter.images.map((img, i) => ({
                ...img,
                label: localized?.alts[i] ?? img.label,
              }))
              const topImages = images.filter((img) => img.place !== 'end')
              const endImages = images.filter((img) => img.place === 'end')
              const copy = (
                <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                  <VuPlate className="mb-5 max-w-full">
                    {localized?.eyebrow ?? chapter.eyebrow}
                  </VuPlate>
                  <div className="min-w-0 space-y-5 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:space-y-6 md:text-[0.98rem] md:leading-[1.8]">
                    {paras.map((p) => (
                      <p key={p.slice(0, 36)}>{p}</p>
                    ))}
                  </div>
                </div>
              )

              const copyOnRight = chapter.copyBeside === 'right'

              return (
                <article key={chapter.eyebrow} className="glass-card overflow-hidden p-0">
                  <ChapterImages images={topImages} />
                  {copyOnRight && endImages.length > 0 ? (
                    <div className="grid lg:grid-cols-2 lg:items-stretch">
                      <div className="order-2 h-72 min-h-0 min-w-0 overflow-hidden sm:h-80 lg:order-1 lg:h-auto">
                        <ChapterImages images={endImages} />
                      </div>
                      <div className="order-1 min-w-0 lg:order-2">{copy}</div>
                    </div>
                  ) : (
                    <>
                      {copy}
                      {endImages.length > 0 ? (
                        <ChapterImages images={endImages} />
                      ) : null}
                    </>
                  )}
                </article>
              )
            })}

            <article className="glass-card grid overflow-hidden p-0 lg:grid-cols-2 lg:items-center">
              <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                <VuPlate className="mb-5 max-w-full">{t.about.venice.eyebrow}</VuPlate>
                <div className="min-w-0 space-y-5 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:space-y-6 md:text-[0.98rem] md:leading-[1.8]">
                  <p>{t.about.venice.body}</p>
                </div>
              </div>
              <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                <VeniceMap />
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
