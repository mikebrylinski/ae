import { useMemo } from 'react'
import { Container } from '@/components/ui/Container'
import {
  GalleryLightbox,
  type GalleryLightboxItem,
} from '@/components/ui/GalleryLightbox'
import { CTABanner } from '@/components/sections/CTABanner'
import { PhotoHeader } from '@/components/sections/PhotoHeader'
import {
  GalleryGrid,
  useGalleryLightbox,
} from '@/components/sections/GalleryGrid'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'

function GalleryLightboxBridge() {
  const { items, lightboxIndex, setLightboxIndex } = useGalleryLightbox()
  const lightboxItems = useMemo<GalleryLightboxItem[]>(
    () =>
      items.map((item) => ({
        src: item.src,
        alt: item.alt,
        caption: item.caption || item.alt,
        sharePath: `/gallery/${item.id}`,
      })),
    [items],
  )

  return (
    <GalleryLightbox
      items={lightboxItems}
      index={lightboxIndex}
      onClose={() => setLightboxIndex(null)}
      onIndexChange={setLightboxIndex}
    />
  )
}

export default function GalleryPage() {
  const { t } = useLanguage()
  useSeo({
    title: t.galleryPage.seoTitle,
    description: t.galleryPage.seoDescription,
  })

  return (
    <GalleryGrid>
      <PhotoHeader
        src="/images/about/on-the-road-foh.jpg"
        alt={t.galleryPage.headerAlt}
        heading={t.galleryPage.heading}
      >
        <GalleryGrid.Header />
      </PhotoHeader>

      <div className="relative isolate overflow-hidden bg-black">
        <PortfolioAurora />

        <section className="relative z-10 pt-4 pb-[clamp(4rem,8vw,7rem)] sm:pt-5">
          <Container>
            <GalleryGrid.Masonry />
          </Container>
        </section>
      </div>

      <CTABanner />
      <GalleryLightboxBridge />
    </GalleryGrid>
  )
}
