import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getProjectBySlug, getRelatedProjects } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { MediaImage } from '@/components/ui/MediaImage'
import { ProjectCard } from '@/components/sections/ProjectCard'
import { CTABanner } from '@/components/sections/CTABanner'
import { useSeo } from '@/hooks/useSeo'

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const project = getProjectBySlug(slug)

  useSeo({
    title: project ? `${project.artist} — ${project.title}` : 'Project',
    description: project?.overview,
  })

  if (!project) {
    return <Navigate to="/portfolio" replace />
  }

  const related = getRelatedProjects(project.slug)

  return (
    <>
      <section className="bg-black">
        <MediaImage
          src={project.heroImage}
          alt={`${project.artist} hero`}
          aspect="aspect-[21/9] min-h-[280px]"
          fallbackLabel={project.artist}
          wrapperClassName="border-0 border-b border-border"
        />

        <Container className="section-pad">
          <Link
            to="/portfolio"
            className="font-heading mb-8 inline-flex items-center gap-2 text-xs tracking-[0.14em] text-primary hover:opacity-80"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Back to Portfolio
          </Link>

          <div className="mb-4 flex flex-wrap gap-2">
            {project.category.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>

          {project.logo ? (
            <MediaImage
              src={project.logo}
              alt={`${project.artist} logo`}
              aspect="mb-8 aspect-[16/9] max-w-lg"
              fit="contain"
              fallbackLabel={project.artist}
              className="!p-8 sm:!p-12"
            />
          ) : null}

          <h1 className="font-heading text-4xl tracking-[0.06em] text-white sm:text-5xl md:text-6xl">
            {project.artist}
          </h1>
          <p className="mt-3 text-lg text-muted">
            {project.title} · {project.year} · {project.role}
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-10">
              <div>
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  Overview
                </h2>
                <p className="text-base leading-relaxed text-foreground/90">
                  {project.overview}
                </p>
              </div>

              <div>
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  Responsibilities
                </h2>
                <ul className="space-y-2">
                  {project.responsibilities.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-primary/60 pl-4 text-sm text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-heading mb-4 text-sm tracking-[0.16em] text-primary">
                  Challenges
                </h2>
                <ul className="space-y-2">
                  {project.challenges.map((item) => (
                    <li key={item} className="text-sm text-muted">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-8 border border-border bg-surface p-6 h-fit">
              <div>
                <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                  Technical Setup
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  {project.technicalSetup}
                </p>
              </div>
              <div>
                <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                  Equipment
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {project.equipment.map((eq) => (
                    <li key={eq}>
                      <Badge variant="muted">{eq}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
              {project.technicalNotes ? (
                <div>
                  <h2 className="font-heading mb-3 text-sm tracking-[0.16em] text-primary">
                    Notes
                  </h2>
                  <p className="text-sm text-muted">{project.technicalNotes}</p>
                </div>
              ) : null}
            </aside>
          </div>

          {project.gallery.length > 0 ? (
            <div className="mt-16">
              <h2 className="font-heading mb-6 text-sm tracking-[0.16em] text-primary">
                Gallery
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.gallery.map((src) => (
                  <li key={src}>
                    <MediaImage
                      src={src}
                      alt={`${project.artist} gallery`}
                      aspect="aspect-video"
                      fallbackLabel={project.artist}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {related.length > 0 ? (
            <div className="mt-20">
              <h2 className="font-heading mb-8 text-2xl tracking-[0.08em] text-white">
                Related Projects
              </h2>
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <li key={p.slug}>
                    <ProjectCard project={p} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
