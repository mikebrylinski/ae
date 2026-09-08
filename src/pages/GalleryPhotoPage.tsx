import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Share2, X } from 'lucide-react'
import { localizeCategory } from '@/lib/content'
import { galleryPhotoUrl, shareOrCopyUrl } from '@/lib/share'
import { interpolate } from '@/i18n/ui'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { CTABanner } from '@/components/sections/CTABanner'
import { LoadingMeter } from '@/components/ui/LoadingMeter'
import { useLiveGalleryState } from '@/hooks/useLiveGallery'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

const chromeBtn =
  'inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-primary bg-black/80 text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function GalleryPhotoPage() {
  const { id } = useParams()
  const photoId = Number.parseInt(id ?? '', 10)
  const { items, ready } = useLiveGalleryState()
  const { lang, t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const item = useMemo(
    () => items.find((photo) => photo.id === photoId) ?? null,
    [items, photoId],
  )

  const caption = (item?.caption || item?.alt || '').trim()
  useSeo({
    title: caption || t.galleryPage.seoTitle,
    description: caption
      ? interpolate(t.galleryPage.seoPhotoDescription, { caption })
      : t.galleryPage.seoDescription,
  })

  async function share() {
    if (!item) return
    try {
      await shareOrCopyUrl(galleryPhotoUrl(item.id), caption, () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2500)
      })
    } catch {
      /* share cancelled or clipboard blocked */
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-black px-5">
        <LoadingMeter label={t.galleryPage.loading} />
      </div>
    )
  }

  if (!item) {
    return (
      <section className="section-pad flex min-h-[70vh] items-center bg-black">
        <Container className="text-center">
          <h1 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
            {t.galleryPage.missingTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted">
            {t.galleryPage.missing}
          </p>
          <Link
            to="/gallery"
            className="font-heading mt-10 inline-flex items-center gap-2 rounded-[1rem] border border-primary px-4 py-2 text-xs tracking-[0.14em] text-primary uppercase"
          >
            {t.galleryPage.backToGallery}
          </Link>
        </Container>
      </section>
    )
  }

  const tags = item.tags.filter(Boolean)
  const meta = [
    item.year ? String(item.year) : '',
    item.category ? localizeCategory(item.category, lang) : '',
  ].filter(Boolean)

  return (
    <>
      <section className="flex min-h-[70vh] items-center justify-center bg-black/92 px-4 py-8 sm:px-8">
        <div className="relative mx-auto flex w-fit max-w-full flex-col overflow-hidden rounded-[1rem] border border-border bg-black">
          <div className="relative">
            <img
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="block h-auto max-h-[min(78vh,860px)] w-auto max-w-[min(100vw-2rem,72rem)] object-contain"
              decoding="async"
            />
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => void share()}
                className={cn(chromeBtn, 'w-auto min-w-[7.5rem] gap-2 px-3')}
                aria-label={copied ? t.galleryPage.copied : t.a11y.sharePhoto}
              >
                <Share2 className="h-5 w-5 shrink-0" aria-hidden />
                <span className="font-heading whitespace-nowrap text-[11px] tracking-[0.14em] uppercase">
                  {copied ? t.galleryPage.copied : t.galleryPage.share}
                </span>
              </button>
              <Link
                to="/gallery"
                className={chromeBtn}
                aria-label={t.galleryPage.backToGallery}
              >
                <X className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>

          {caption ? (
            <h1 className="block w-full min-w-0 bg-black px-4 py-3 text-center font-heading text-[11px] leading-snug tracking-[0.04em] text-white sm:text-[13px]">
              {caption}
            </h1>
          ) : (
            <h1 className="sr-only">{t.galleryPage.photo}</h1>
          )}

          {meta.length > 0 || tags.length > 0 ? (
            <div className="flex w-full min-w-0 flex-col items-center gap-3 border-t border-white/10 bg-black px-4 py-4">
              {meta.length > 0 ? (
                <p className="font-heading text-center text-[11px] tracking-[0.14em] text-muted uppercase">
                  {meta.join(' · ')}
                </p>
              ) : null}
              {tags.length > 0 ? (
                <ul className="flex max-w-full flex-wrap justify-center gap-1.5">
                  {tags.map((tag) => (
                    <li key={tag}>
                      <Badge variant="muted">{localizeCategory(tag, lang)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <CTABanner />
    </>
  )
}
