import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import { MediaImage } from '@/components/ui/MediaImage'
import { Badge } from '@/components/ui/Badge'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const src = project.logo || project.thumbnail

  return (
    <Link
      to={`/portfolio/${project.slug}`}
      className="card-lift group block focus-visible:outline-none"
    >
      <MediaImage
        src={src}
        alt={`${project.artist} logo`}
        aspect="aspect-[4/3]"
        fit="contain"
        fallbackLabel={project.artist}
        className="!p-2"
        wrapperClassName="transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_0_28px_rgba(184,255,0,0.08)]"
      />
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {project.category.slice(0, 2).map((c) => (
            <Badge key={c} variant="muted">
              {c}
            </Badge>
          ))}
        </div>
        <h3 className="font-heading text-xl tracking-[0.06em] text-white transition-colors duration-500 group-hover:text-primary">
          {project.artist}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {project.title} · {project.year}
        </p>
        <p className="mt-1 text-xs tracking-wide text-primary uppercase">
          {project.role}
        </p>
      </div>
    </Link>
  )
}
