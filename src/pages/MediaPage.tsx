import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { gallery, press, site } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import {
  GalleryLightbox,
  type GalleryLightboxItem,
} from '@/components/ui/GalleryLightbox'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { CTABanner } from '@/components/sections/CTABanner'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { VuPlate } from '@/components/ui/VuPlate'

const galleryFilters = [
  'All',
  'Arena',
  'Backstage',
  'Monitor World',
  'Rehearsals',
  'Crew',
  'Equipment',
] as const

type LightboxState = {
  items: GalleryLightboxItem[]
  index: number
}

export default function MediaPage() {
  useSeo({
    title: 'Press & Media',
    description:
      'Press coverage, biography, headshots, and media downloads for Andy Ebert.',
  })

  const [filter, setFilter] = useState<(typeof galleryFilters)[number]>('All')
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const filteredGallery = useMemo(
    () =>
      filter === 'All'
        ? gallery
        : gallery.filter((g) => g.category === filter),
    [filter],
  )

  const headshotItems: GalleryLightboxItem[] = site.media.headshots.map(
    (src, i) => ({
      src,
      alt: `Andy Ebert headshot ${i + 1}`,
    }),
  )

  const galleryItems: GalleryLightboxItem[] = filteredGallery.map((item) => ({
    src: item.src,
    alt: item.alt,
  }))

  return (
    <>
      <section className="bg-black py-20 sm:py-24 md:py-28 lg:py-32">
        <Container>
          <VuPlate className="mb-3">Media Kit</VuPlate>
          <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl md:text-6xl">
            Press & Media
          </h1>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr] md:mt-16">
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
            <h2 className="font-heading mb-8 md:mb-10 text-2xl tracking-[0.08em] text-white">
              Press
            </h2>
            <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {press.map((item) => {
                const hasLink = Boolean(item.url && item.url !== '#')
                const meta = [item.publication, item.date].filter(Boolean).join(' · ')
                const body = (
                  <div className="p-5 md:p-6">
                    <Badge variant="muted">{item.type}</Badge>
                    <h3 className="font-heading mt-3 text-lg tracking-[0.06em] text-white group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{meta}</p>
                    <p className="mt-3 text-sm text-foreground/80">{item.excerpt}</p>
                  </div>
                )

                return (
                  <li key={item.id} className="border border-border bg-surface">
                    {hasLink ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block h-full transition-[border-color,box-shadow] duration-500 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
                      >
                        {body}
                      </a>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-24 md:mt-28">
            <h2 className="font-heading mb-6 md:mb-8 text-2xl tracking-[0.08em] text-white">
              Gallery
            </h2>
            <div className="mb-8 flex flex-wrap gap-2" role="tablist">
              {galleryFilters.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={filter === cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    'font-heading border px-3 py-2 text-[11px] tracking-[0.12em] uppercase',
                    filter === cat
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted hover:text-primary',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {filteredGallery.map((item, i) => (
                <li key={item.id} className="mb-4 break-inside-avoid">
                  <button
                    type="button"
                    className="group w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={() =>
                      setLightbox({ items: galleryItems, index: i })
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
      <CTABanner />
      <GalleryLightbox
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </>
  )
}
