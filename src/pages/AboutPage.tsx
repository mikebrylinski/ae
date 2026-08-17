import { site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { CTABanner } from '@/components/sections/CTABanner'
import { BerlinSkyline } from '@/components/sections/BerlinSkyline'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'

const CHAPTERS = [
  {
    eyebrow: 'West Berlin',
    from: 0,
    to: 4,
    side: 'right' as const,
    images: [
      {
        src: '/images/about/west-berlin.jpg',
        label: 'Analog mixer',
        aspect: 'aspect-[4/5]',
      },
    ],
  },
  {
    eyebrow: 'The basement',
    from: 4,
    to: 7,
    side: 'wide' as const,
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
    side: 'wide' as const,
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
    side: 'left' as const,
    images: [
      {
        src: '/images/about/outboard-rack.jpg',
        label: 'IEM racks',
        aspect: 'aspect-[3/4]',
      },
    ],
  },
] as const

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

      <section className="section-pad bg-black">
        <Container className="lg:px-12 xl:px-14">
          <p className="font-heading mb-3 text-center text-xs tracking-[0.2em] text-primary">
            About
          </p>

          <div className="mt-10 space-y-16 md:mt-14 md:space-y-24">
            {CHAPTERS.map((chapter) => {
              const paras = about.story.slice(chapter.from, chapter.to)
              const images = (
                <div
                  className={cn(
                    'mx-auto w-full',
                    chapter.images.length > 1
                      ? chapter.side === 'wide'
                        ? 'grid gap-4 sm:grid-cols-2'
                        : 'grid gap-4'
                      : 'w-full',
                  )}
                >
                  {chapter.images.map((img, i) => (
                    <MediaImage
                      key={img.label}
                      src={img.src}
                      alt={img.label}
                      fallbackLabel={img.label}
                      aspect={img.aspect}
                      wrapperClassName={
                        chapter.side === 'wide' &&
                        chapter.images.length === 3 &&
                        i === 2
                          ? 'sm:col-span-2'
                          : undefined
                      }
                    />
                  ))}
                </div>
              )

              if (chapter.side === 'wide') {
                return (
                  <article key={chapter.eyebrow} className="space-y-8 text-center md:space-y-10">
                    {images}
                    <div className="mx-auto w-full">
                      <p className="font-heading mb-4 text-[0.65rem] tracking-[0.22em] text-primary">
                        {chapter.eyebrow}
                      </p>
                      <div className="space-y-6 text-base leading-relaxed text-foreground/90 md:text-[1.05rem] md:leading-[1.8]">
                        {paras.map((p) => (
                          <p key={p.slice(0, 36)}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </article>
                )
              }

              const imageCol = (
                <div
                  className={cn(
                    'md:sticky md:top-28',
                    chapter.side === 'left' ? 'md:order-1' : 'md:order-2',
                  )}
                >
                  {images}
                </div>
              )

              return (
                <article
                  key={chapter.eyebrow}
                  className="grid w-full items-start gap-8 text-center md:grid-cols-2 md:gap-12 lg:gap-16"
                >
                  {chapter.side === 'left' ? imageCol : null}
                  <div
                    className={cn(
                      chapter.side === 'left' ? 'md:order-2' : 'md:order-1',
                    )}
                  >
                    <p className="font-heading mb-4 text-[0.65rem] tracking-[0.22em] text-primary">
                      {chapter.eyebrow}
                    </p>
                    <div className="space-y-6 text-base leading-relaxed text-foreground/90 md:text-[1.05rem] md:leading-[1.8]">
                      {paras.map((p) => (
                        <p key={p.slice(0, 36)}>{p}</p>
                      ))}
                    </div>
                  </div>
                  {chapter.side === 'right' ? imageCol : null}
                </article>
              )
            })}
          </div>

          {about.next ? (
            <p className="font-heading mt-16 text-center text-sm tracking-[0.12em] text-primary md:mt-24 sm:text-base">
              {about.next}
            </p>
          ) : null}
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
