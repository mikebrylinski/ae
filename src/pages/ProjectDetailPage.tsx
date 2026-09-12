import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import {
  getArtistIntro,
  getChartVenueChips,
  getPressForProject,
  getProjectBySlug,
  getRelatedProjects,
  localizeCategory,
  localizePressType,
  localizeProject,
  resolveProjectGallerySources,
  pressAnchorProps,
  type ProjectGallerySource,
} from '@/lib/content'
import { interpolate } from '@/i18n/ui'
import { galleryPhotoPath } from '@/lib/share'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  GalleryLightbox,
  type GalleryLightboxItem,
} from '@/components/ui/GalleryLightbox'
import { MediaImage } from '@/components/ui/MediaImage'
import { ProjectCard } from '@/components/sections/ProjectCard'
import { CTABanner } from '@/components/sections/CTABanner'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'
import { useLanguage } from '@/i18n/LanguageProvider'
import { useLiveGalleryState } from '@/hooks/useLiveGallery'
import {
  parseCreditsPage,
  parseCreditsRole,
  portfolioCreditsLocation,
  readStoredCreditsView,
  type CreditsView,
} from '@/lib/creditsView'
import {
  GALLERY_TILE_ASPECT_CLASS,
  galleryTilePositionStyle,
} from '@/lib/galleryFocal'

const CARD_IMAGE_FOCUS: Record<string, string> = {
  'maroon-5': 'object-[center_58%]',
  'golden-gospel-singers': 'object-center',
}

/** Only renders gallery images that load; hides the section when none do. No placeholders. */
function ProjectGallery({
  artist,
  sources,
}: {
  artist: string
  sources: ProjectGallerySource[]
}) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState<ProjectGallerySource[]>([])
  const [ready, setReady] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    if (sources.length === 0) {
      setVisible([])
      setReady(true)
      return
    }

    setReady(false)
    Promise.all(
      sources.map(
        (item) =>
          new Promise<ProjectGallerySource | null>((resolve) => {
            const img = new Image()
            img.onload = () => resolve(item)
            img.onerror = () => resolve(null)
            img.src = item.src
          }),
      ),
    ).then((results) => {
      if (cancelled) return
      setVisible(results.filter((item): item is ProjectGallerySource => Boolean(item)))
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [sources])

  const lightboxItems = useMemo<GalleryLightboxItem[]>(
    () =>
      visible.map((item, i) => ({
        src: item.src,
        alt: item.alt || interpolate(t.project.galleryAlt, { artist, n: i + 1 }),
        caption: item.caption || item.alt,
        sharePath: item.id != null ? galleryPhotoPath(item.id) : undefined,
      })),
    [artist, t, visible],
  )

  if (!ready || visible.length === 0) return null

  return (
    <div className="mt-14 min-w-0 sm:mt-16">
      <h2 className="font-heading mb-6 text-sm tracking-[0.16em] text-primary">
        {t.project.gallery}
      </h2>
      <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, i) => {
          const alt =
            item.alt || interpolate(t.project.galleryAlt, { artist, n: i + 1 })
          const caption = (item.caption || alt).trim()
          return (
          <li key={item.src} className="min-w-0">
            <button
              type="button"
              className="group relative w-full max-w-full cursor-pointer rounded-[1rem] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setLightboxIndex(i)}
              aria-label={interpolate(t.a11y.viewProjectGallery, {
                artist,
                n: i + 1,
              })}
            >
              <span
                className={cn(
                  'relative block overflow-hidden rounded-[1rem] border border-border bg-black',
                  'transition-[border-color,box-shadow] duration-500',
                  'group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]',
                )}
              >
                <MediaImage
                  src={item.src}
                  alt={alt}
                  aspect={GALLERY_TILE_ASPECT_CLASS}
                  wrapperClassName="border-0 bg-black"
                  style={galleryTilePositionStyle(item.focalX, item.focalY)}
                  loading="lazy"
                  decoding="async"
                />
                {caption ? (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black px-3 py-2 text-center font-heading text-[11px] leading-snug tracking-[0.04em] text-white">
                    <span className="line-clamp-2">{caption}</span>
                  </span>
                ) : null}
              </span>
            </button>
          </li>
          )
        })}
      </ul>

      <GalleryLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const { lang, t } = useLanguage()
  const galleryState = useLiveGalleryState()
  const galleryItems = galleryState.items
  const projectRaw = getProjectBySlug(slug)
  const project = projectRaw ? localizeProject(projectRaw, lang) : undefined
  const creditsState = location.state as CreditsView | null
  const backTo = portfolioCreditsLocation(
    creditsState?.page || creditsState?.role
      ? {
          page: parseCreditsPage(String(creditsState.page ?? 1)),
          role: parseCreditsRole(creditsState.role),
        }
      : readStoredCreditsView(),
  )

  useSeo({
    title: project ? `${project.artist} — ${project.title}` : t.project.seoFallback,
    description: project?.overview,
  })

  if (slug === 'neil-young-velvet-revolver') {
    return <Navigate to="/portfolio/neil-young" replace />
  }

  if (!project) {
    return <Navigate to={backTo} replace />
  }

  const related = getRelatedProjects(project.slug)
  const venueChips = getChartVenueChips(project.category)
  const pressItems = getPressForProject(project.slug)
  const artistIntro = getArtistIntro(project.slug, lang)
  const gallerySources = resolveProjectGallerySources(
    project.gallery,
    project.artist,
    project.slug,
    galleryItems,
    galleryState.artistOrder[project.slug],
  )

  return (
    <>
      <div className="relative isolate min-w-0 overflow-hidden bg-black">
        <PortfolioAurora />
      <section
        className="relative z-10 w-full min-w-0 overflow-hidden border-b border-border"
        aria-label={`${project.artist} header`}
      >
        <div className="absolute inset-0" aria-hidden>
          <MediaImage
            src={project.heroImage}
            alt=""
            fit="cover"
            aspect="absolute inset-0 h-full w-full"
            wrapperClassName="border-0"
            className="!h-full !w-full object-cover object-center"
            fallbackLabel={project.artist}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <Container className="relative z-10 min-w-0 py-6 sm:py-8 md:py-10 lg:py-12">
          <GlassCard
            className={cn(
              'mx-auto w-full min-w-0 max-w-4xl overflow-hidden p-0',
              project.cardImage && 'sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] sm:items-stretch',
            )}
          >
            {project.cardImage ? (
              <div className="relative aspect-[5/4] w-full overflow-hidden border-b border-white/10 sm:aspect-auto sm:min-h-0 sm:self-stretch sm:border-b-0 sm:border-r">
                <img
                  src={project.cardImage}
                  alt=""
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover',
                    CARD_IMAGE_FOCUS[project.slug] ??
                      'object-top sm:object-[center_12%]',
                  )}
                  loading="lazy"
                  decoding="async"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-black/40"
                  aria-hidden
                />
              </div>
            ) : null}

            <div className="min-w-0 p-5 sm:p-7 md:p-8">
              <Link
                to={backTo}
                className="font-heading inline-flex max-w-full items-center gap-2 rounded-[1rem] border border-primary/40 px-3 py-1.5 text-xs tracking-[0.14em] text-primary transition-colors hover:border-primary hover:opacity-90"
              >
                <ArrowLeft size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{t.project.back}</span>
              </Link>

              {venueChips.length > 0 ? (
                <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 sm:mt-5 sm:justify-start">
                  {venueChips.map((c) => (
                    <Badge key={c} className="max-w-full shrink">
                      {localizeCategory(c, lang)}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <h1 className="font-heading mt-5 text-[clamp(1.65rem,6.5vw,3.25rem)] leading-[1.15] tracking-[0.04em] break-words text-white sm:mt-6 sm:tracking-[0.06em]">
                {project.artist}
              </h1>
              <p className="mt-3 max-w-full text-sm leading-relaxed break-words text-muted sm:text-base">
                {project.title}
                <span className="mx-1.5 text-white/30" aria-hidden>
                  ·
                </span>
                {project.year}
                <span className="mx-1.5 text-white/30" aria-hidden>
                  ·
                </span>
                {project.role}
              </p>
            </div>
          </GlassCard>
        </Container>
      </section>

      <section className="relative z-10 min-w-0 overflow-x-hidden">
        <Container className="section-pad min-w-0">
          <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0 space-y-10">
              {artistIntro ? (
                <article className="min-w-0 rounded-[1rem] border border-border bg-surface/70 p-5 sm:p-6">
                  <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                    {t.project.artistIntro}
                  </h2>
                  <div className="space-y-3">
                    {artistIntro.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-relaxed break-words text-foreground/85 sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {artistIntro.sources.length > 0 ? (
                    <p className="mt-4 flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="font-heading tracking-[0.12em] uppercase">
                        {t.project.wikiSource}
                      </span>
                      {artistIntro.sources.map((source) => (
                        <a
                          key={source.href}
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-w-0 items-center gap-1 text-primary/85 transition-colors hover:text-primary"
                        >
                          <span className="min-w-0 truncate">{source.label}</span>
                          <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
                        </a>
                      ))}
                    </p>
                  ) : null}
                </article>
              ) : null}

              <div className="min-w-0">
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  {t.project.overview}
                </h2>
                <p className="text-base leading-relaxed break-words text-foreground/90">
                  {project.overview}
                </p>
              </div>

              <div className="min-w-0">
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  {t.project.responsibilities}
                </h2>
                <ul className="space-y-2">
                  {project.responsibilities.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-primary/60 pl-4 text-sm break-words text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0">
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  {t.project.challenges}
                </h2>
                <ul className="space-y-2">
                  {project.challenges.map((item) => (
                    <li key={item} className="text-sm break-words text-muted">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="h-fit min-w-0 max-w-full space-y-8 rounded-[1rem] border border-border bg-surface p-5 sm:p-6">
              <div className="min-w-0">
                <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                  {t.project.technicalSetup}
                </h2>
                <p className="text-sm leading-relaxed break-words text-muted">
                  {project.technicalSetup}
                </p>
              </div>
              <div className="min-w-0">
                <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                  {t.project.equipment}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {project.equipment.map((eq) => (
                    <li key={eq} className="min-w-0 max-w-full">
                      <Badge variant="muted" className="max-w-full whitespace-normal">
                        {eq}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
              {project.technicalNotes ? (
                <div className="min-w-0">
                  <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                    {t.project.notes}
                  </h2>
                  <p className="text-sm break-words text-muted">
                    {project.technicalNotes}
                  </p>
                </div>
              ) : null}
            </aside>
          </div>

          <ProjectGallery artist={project.artist} sources={gallerySources} />

          {pressItems.length > 0 ? (
            <div className="mt-14 min-w-0 sm:mt-16">
              <h2 className="font-heading mb-6 text-sm tracking-[0.16em] text-primary">
                {t.project.press}
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {pressItems.map((item) => {
                  const link = pressAnchorProps(item)
                  const meta = [item.publication, item.date]
                    .filter(Boolean)
                    .join(' · ')
                  const cta = item.pdf
                    ? t.press.openPdf
                    : link
                      ? t.press.readArticle
                      : null
                  const inner = (
                    <>
                      {item.image ? (
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black">
                          <img
                            src={item.image}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                            loading="lazy"
                            decoding="async"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15"
                            aria-hidden
                          />
                        </div>
                      ) : (
                        <div
                          className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-white/10 bg-black"
                          aria-hidden
                        >
                          <img
                            src="/favicon.svg"
                            alt=""
                            className="h-14 w-14 object-contain"
                          />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                        <Badge variant="muted" className="w-fit">
                          {localizePressType(item.type, lang)}
                        </Badge>
                        <p className="font-heading mt-3 text-sm tracking-[0.04em] text-white transition-colors group-hover:text-primary sm:text-base">
                          {item.title}
                        </p>
                        {meta ? (
                          <p className="mt-1 text-xs text-muted sm:text-sm">{meta}</p>
                        ) : null}
                        {cta ? (
                          <p className="font-heading mt-auto pt-3 inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-primary/80 uppercase transition-colors group-hover:text-primary">
                            {cta}
                            <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
                          </p>
                        ) : null}
                      </div>
                    </>
                  )

                  return (
                    <li
                      key={item.id}
                      className="glass-card min-w-0 overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
                    >
                      {link ? (
                        <a
                          {...link}
                          className="group flex h-full min-w-0 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="flex h-full min-w-0 flex-col">{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {related.length > 0 ? (
            <div className="mt-16 min-w-0 sm:mt-20">
              <h2 className="font-heading mb-6 text-xl tracking-[0.08em] break-words text-white sm:mb-8 sm:text-2xl">
                {t.project.related}
              </h2>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                {related.map((p) => (
                  <li key={p.slug} className="min-w-0">
                    <ProjectCard project={p} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>
      </div>
      <CTABanner />
    </>
  )
}
