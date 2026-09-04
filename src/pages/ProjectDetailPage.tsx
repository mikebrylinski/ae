import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  getChartVenueChips,
  getProjectBySlug,
  getRelatedProjects,
} from '@/lib/content'
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

/** Only renders gallery images that load; hides the section when none do. No placeholders. */
function ProjectGallery({
  artist,
  sources,
}: {
  artist: string
  sources: string[]
}) {
  const [visible, setVisible] = useState<string[]>([])
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
        (src) =>
          new Promise<string | null>((resolve) => {
            const img = new Image()
            img.onload = () => resolve(src)
            img.onerror = () => resolve(null)
            img.src = src
          }),
      ),
    ).then((results) => {
      if (cancelled) return
      setVisible(results.filter((src): src is string => Boolean(src)))
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [sources])

  const lightboxItems = useMemo<GalleryLightboxItem[]>(
    () =>
      visible.map((src, i) => ({
        src,
        alt: `${artist} gallery image ${i + 1}`,
      })),
    [artist, visible],
  )

  if (!ready || visible.length === 0) return null

  return (
    <div className="mt-14 min-w-0 sm:mt-16">
      <h2 className="font-heading mb-6 text-sm tracking-[0.16em] text-primary">
        Gallery
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((src, i) => (
          <li key={src} className="min-w-0">
            <button
              type="button"
              className="group w-full max-w-full cursor-pointer rounded-[1rem] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View ${artist} gallery image ${i + 1} larger`}
            >
              <div
                className={cn(
                  'relative aspect-video w-full overflow-hidden rounded-[1rem] border border-border bg-black',
                  'transition-[border-color,box-shadow] duration-500',
                  'group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]',
                )}
              >
                <img
                  src={src}
                  alt={`${artist} gallery image ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </button>
          </li>
        ))}
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
  const project = getProjectBySlug(slug)

  useSeo({
    title: project ? `${project.artist} — ${project.title}` : 'Project',
    description: project?.overview,
  })

  if (slug === 'neil-young-velvet-revolver') {
    return <Navigate to="/portfolio/neil-young" replace />
  }

  if (!project) {
    return <Navigate to="/portfolio" replace />
  }

  const related = getRelatedProjects(project.slug)
  const venueChips = getChartVenueChips(project.category)

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
                  className="absolute inset-0 h-full w-full object-cover object-top sm:object-[center_12%]"
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
                to="/portfolio"
                className="font-heading inline-flex max-w-full items-center gap-2 rounded-[1rem] border border-primary/40 px-3 py-1.5 text-xs tracking-[0.14em] text-primary transition-colors hover:border-primary hover:opacity-90"
              >
                <ArrowLeft size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
                <span className="min-w-0 truncate">Back to Portfolio</span>
              </Link>

              {venueChips.length > 0 ? (
                <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 sm:mt-5 sm:justify-start">
                  {venueChips.map((c) => (
                    <Badge key={c} className="max-w-full shrink">
                      {c}
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
              <div className="min-w-0">
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  Overview
                </h2>
                <p className="text-base leading-relaxed break-words text-foreground/90">
                  {project.overview}
                </p>
              </div>

              <div className="min-w-0">
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  Responsibilities
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
                  Challenges
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
                  Technical Setup
                </h2>
                <p className="text-sm leading-relaxed break-words text-muted">
                  {project.technicalSetup}
                </p>
              </div>
              <div className="min-w-0">
                <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                  Equipment
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
                    Notes
                  </h2>
                  <p className="text-sm break-words text-muted">
                    {project.technicalNotes}
                  </p>
                </div>
              ) : null}
            </aside>
          </div>

          <ProjectGallery artist={project.artist} sources={project.gallery} />

          {related.length > 0 ? (
            <div className="mt-16 min-w-0 sm:mt-20">
              <h2 className="font-heading mb-6 text-xl tracking-[0.08em] break-words text-white sm:mb-8 sm:text-2xl">
                Related Projects
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

          {project.slug === 'alanis-morissette' ? (
            <div className="mt-16 overflow-hidden rounded-[1rem] sm:mt-20">
              <MediaImage
                src="/images/projects/alanis-stage.jpg"
                alt={`${project.artist} on stage`}
                fit="contain"
                aspect="aspect-[500/752]"
                wrapperClassName="mx-auto w-full max-w-md rounded-none border-0 bg-black"
                className="object-contain object-center"
                fallbackLabel={project.artist}
              />
            </div>
          ) : null}
        </Container>
      </section>
      </div>
      <CTABanner />
    </>
  )
}
