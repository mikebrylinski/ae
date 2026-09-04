import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGalleryTeaser, site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import {
  GalleryLightbox,
  type GalleryLightboxItem,
} from '@/components/ui/GalleryLightbox'
import { buttonVariants } from '@/components/ui/Button'
import { CTABanner } from '@/components/sections/CTABanner'
import { PhotoHeader } from '@/components/sections/PhotoHeader'
import {
  PRESS_SECTION_ID,
  PressTimeline,
} from '@/components/sections/PressTimeline'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { VuPlate } from '@/components/ui/VuPlate'

type LightboxState = {
  items: GalleryLightboxItem[]
  index: number
}

export default function MediaPage() {
  const { t } = useLanguage()
  useSeo({
    title: 'Press & Media',
    description:
      'Press coverage, biography, headshots, and media downloads for Andy Ebert.',
  })

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const teaser = useMemo(() => getGalleryTeaser(6), [])

  const headshotItems: GalleryLightboxItem[] = site.media.headshots.map(
    (src, i) => ({
      src,
      alt: `Andy Ebert headshot ${i + 1}`,
    }),
  )

  const teaserItems: GalleryLightboxItem[] = teaser.map((item) => ({
    src: item.src,
    alt: item.alt,
  }))

  return (
    <PressTimeline>
      <PhotoHeader
        src="/images/media/header-bg.jpg"
        alt="Arena concert stage from the press pit"
        heading="Press"
      >
        <PressTimeline.Header />
      </PhotoHeader>

      <div className="relative isolate overflow-hidden bg-black">
        <PortfolioAurora />

        <section
          id={PRESS_SECTION_ID}
          className="relative z-10 scroll-mt-32 border-b border-border pb-[clamp(4rem,8vw,7rem)] pt-10 md:scroll-mt-40 md:pt-14"
        >
          <Container>
            <PressTimeline.List />
          </Container>
        </section>

        <section className="relative z-10 bg-black py-16 sm:py-20 md:py-24 lg:py-28">
          <Container>
          <VuPlate className="mb-8">Media Kit</VuPlate>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                Biography
              </h2>
              <p className="text-base leading-relaxed text-foreground/90">
                {site.media.biography}
              </p>
            </div>
            <div>
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                Downloads
              </h2>
              <ul className="space-y-3">
                {site.media.downloads.map((d) => {
                  const isPage = d.type === 'Page' || !/\.\w+$/.test(d.href)
                  const className = cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'w-full justify-between sm:w-auto',
                  )
                  const content = (
                    <>
                      <span>{d.label}</span>
                      <span className="text-primary">{d.type}</span>
                    </>
                  )

                  return (
                    <li key={d.href}>
                      {isPage ? (
                        <Link to={d.href} className={className}>
                          {content}
                        </Link>
                      ) : (
                        <a href={d.href} download className={className}>
                          {content}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 text-sm text-muted">
                Input lists, rack layouts, and console charts —{' '}
                <Link
                  to="/downloads"
                  className="font-heading text-xs tracking-[0.12em] text-primary uppercase hover:opacity-80"
                >
                  Browse all downloads
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-20 md:mt-24">
            <h2 className="font-heading mb-6 md:mb-8 text-2xl tracking-[0.08em] text-white">
              Headshots
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {site.media.headshots.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    className="group w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={() =>
                      setLightbox({ items: headshotItems, index: i })
                    }
                    aria-label={`View headshot ${i + 1} larger`}
                  >
                    <MediaImage
                      src={src}
                      alt={`Andy Ebert headshot ${i + 1}`}
                      aspect="aspect-[3/4]"
                      fallbackLabel={`Headshot ${i + 1}`}
                      wrapperClassName="transition-[border-color,box-shadow] duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-24 md:mt-28">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-heading text-2xl tracking-[0.08em] text-white">
                {t.media.gallery}
              </h2>
              <Link
                to="/gallery"
                className="font-heading text-xs tracking-[0.16em] text-primary uppercase transition-opacity duration-500 hover:opacity-80"
              >
                {t.media.viewFullGallery}
              </Link>
            </div>
            <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {teaser.map((item, i) => (
                <li key={item.id} className="mb-4 break-inside-avoid">
                  <button
                    type="button"
                    className="group w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={() =>
                      setLightbox({ items: teaserItems, index: i })
                    }
                    aria-label={`View ${item.alt} larger`}
                  >
                    <MediaImage
                      src={item.src}
                      alt={item.alt}
                      aspect=""
                      fallbackLabel={item.category}
                      wrapperClassName="border border-border transition-[border-color,box-shadow] duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
                      wrapperStyle={{
                        aspectRatio: `${item.width}/${item.height}`,
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          </Container>
        </section>
      </div>
      <CTABanner />
      <GalleryLightbox
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </PressTimeline>
  )
}
