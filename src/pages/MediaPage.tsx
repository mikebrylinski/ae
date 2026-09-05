import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSite } from '@/lib/content'
import { interpolate } from '@/i18n/ui'
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
  const { lang, t } = useLanguage()
  const site = getSite(lang)
  useSeo({
    title: t.media.seoTitle,
    description: t.media.seoDescription,
  })

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const headshotItems: GalleryLightboxItem[] = site.media.headshots.map(
    (src, i) => ({
      src,
      alt: interpolate(t.media.headshotAlt, { n: i + 1 }),
    }),
  )

  return (
    <PressTimeline>
      <PhotoHeader
        src="/images/media/header-bg.jpg"
        alt={t.media.headerAlt}
        heading={t.press.title}
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
          <VuPlate className="mb-8">{t.media.kit}</VuPlate>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                {t.media.biography}
              </h2>
              <p className="text-base leading-relaxed text-foreground/90">
                {site.media.biography}
              </p>
            </div>
            <div>
              <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                {t.media.downloads}
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
                      <span className="text-primary">
                        {d.type === 'Page' ? t.media.downloadTypePage : d.type}
                      </span>
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
                {t.media.downloadsNote}{' '}
                <Link
                  to="/downloads"
                  className="font-heading text-xs tracking-[0.12em] text-primary uppercase hover:opacity-80"
                >
                  {t.media.browse}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-20 md:mt-24">
            <h2 className="font-heading mb-6 md:mb-8 text-2xl tracking-[0.08em] text-white">
              {t.media.headshots}
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
                    aria-label={interpolate(t.a11y.viewHeadshot, { n: i + 1 })}
                  >
                    <MediaImage
                      src={src}
                      alt={interpolate(t.media.headshotAlt, { n: i + 1 })}
                      aspect="aspect-[3/4]"
                      fallbackLabel={interpolate(t.media.headshotFallback, {
                        n: i + 1,
                      })}
                      wrapperClassName="transition-[border-color,box-shadow] duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
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
