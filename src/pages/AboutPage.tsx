import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { CTABanner } from '@/components/sections/CTABanner'
import { BerlinSkyline } from '@/components/sections/BerlinSkyline'
import { VuPlate } from '@/components/ui/VuPlate'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'

const CHAPTERS = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 4,
    layout: 'split' as const,
    imageSide: 'right' as const,
    images: [
      {
        src: '/images/about/west-berlin.jpg',
        label: 'Analog mixer',
        aspect: 'aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[28rem]',
      },
    ],
  },
  {
    eyebrow: 'The basement',
    from: 4,
    to: 7,
    layout: 'stack' as const,
    images: [
      {
        src: '/images/about/basement-studio.jpg',
        label: 'Basement mixer',
        aspect: 'aspect-[16/9]',
      },
    ],
  },
  {
    eyebrow: 'On the road',
    from: 7,
    to: 10,
    layout: 'stack' as const,
    images: [
      {
        src: '/images/about/gospel-tour.jpg',
        label: 'Analog console',
        aspect: 'aspect-[4/3]',
      },
      {
        src: '/images/about/tse-berlin.jpg',
        label: 'Live console',
        aspect: 'aspect-[4/3]',
      },
      {
        src: '/images/about/monitor-world.jpg',
        label: 'Digital surface',
        aspect: 'aspect-[16/9]',
      },
    ],
  },
  {
    eyebrow: 'Los Angeles',
    from: 10,
    to: 13,
    layout: 'split' as const,
    imageSide: 'left' as const,
    images: [
      {
        src: '/images/about/ots-arena.jpg',
        label: 'View from the console over an arena crowd',
        aspect: 'aspect-[16/9]',
      },
      {
        src: '/images/about/ots-amphitheater.jpg',
        label: 'View from the console toward an outdoor stage',
        aspect: 'aspect-[16/9]',
      },
    ],
  },
] as const

function ChapterImages({
  images,
  layout,
}: {
  images: (typeof CHAPTERS)[number]['images']
  layout: (typeof CHAPTERS)[number]['layout']
}) {
  const many = images.length > 1

  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden',
        many && layout === 'stack' && 'grid gap-px sm:grid-cols-2',
        many && layout === 'split' && 'grid gap-px',
        !many && 'h-full min-h-[16rem]',
      )}
    >
      {images.map((img, i) => (
        <MediaImage
          key={img.label}
          src={img.src}
          alt={img.label}
          fallbackLabel={img.label}
          aspect={img.aspect}
          className="object-cover"
          wrapperClassName={cn(
            'w-full border-0',
            !many && 'h-full',
            layout === 'stack' && images.length === 3 && i === 2 && 'sm:col-span-2',
          )}
        />
      ))}
    </div>
  )
}

export default function AboutPage() {
  useSeo({
    title: 'About',
    description:
      'Andy Ebert — sound engineer and plant powered roadie, born in West Berlin in 1971. Professionally touring since 1997.',
  })

  const { about } = site

  return (
    <>
      <BerlinSkyline
        heading={about.headline ?? 'Andy Ebert'}
        subheading={about.subhead ?? 'Sound Engineer & Plant Powered Roadie'}
      />

      <section className="section-divider-top bg-black py-16 sm:py-20 md:py-24 lg:py-28">
        <Container>
          <VuPlate className="mx-auto mb-8 md:mb-10">About</VuPlate>

          <div className="space-y-8 md:space-y-10">
            {CHAPTERS.map((chapter) => {
              const paras = about.story.slice(chapter.from, chapter.to)
              const copy = (
                <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                  <VuPlate className="mb-5 max-w-full">{chapter.eyebrow}</VuPlate>
                  <div className="min-w-0 space-y-5 text-[0.9375rem] leading-relaxed break-words text-foreground/90 md:space-y-6 md:text-[0.98rem] md:leading-[1.8]">
                    {paras.map((p) => (
                      <p key={p.slice(0, 36)}>{p}</p>
                    ))}
                  </div>
                </div>
              )

              if (chapter.layout === 'stack') {
                return (
                  <article key={chapter.eyebrow} className="glass-card overflow-hidden p-0">
                    <ChapterImages images={chapter.images} layout={chapter.layout} />
                    {copy}
                  </article>
                )
              }

              const imageFirst = chapter.imageSide === 'left'

              return (
                <article
                  key={chapter.eyebrow}
                  className="glass-card grid overflow-hidden p-0 lg:grid-cols-2 lg:items-start"
                >
                  <div className={cn('min-w-0 overflow-hidden', imageFirst ? 'lg:order-1' : 'lg:order-2')}>
                    <ChapterImages images={chapter.images} layout={chapter.layout} />
                  </div>
                  <div className={cn('min-w-0', imageFirst ? 'lg:order-2' : 'lg:order-1')}>
                    {copy}
                  </div>
                </article>
              )
            })}
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
