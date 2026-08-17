import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/portfolio/${project.slug}`}
      className="card-lift group block focus-visible:outline-none"
    >
      <div className="relative flex aspect-[5/4] flex-col items-center justify-center overflow-hidden border border-border bg-black px-2.5 py-3 text-center transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_0_28px_rgba(184,255,0,0.08)] sm:aspect-[4/3] sm:px-4 sm:py-5">
        <h3 className="font-heading text-sm leading-tight tracking-[0.04em] text-white transition-colors duration-500 group-hover:text-primary sm:text-lg md:text-xl">
          {project.artist}
        </h3>
        <p className="mt-1 text-[9px] leading-snug tracking-[0.1em] text-muted uppercase sm:mt-2 sm:text-[11px] sm:tracking-[0.12em]">
          {project.year}
          <span className="mx-1 text-border sm:mx-1.5" aria-hidden>
            ·
          </span>
          {project.role}
        </p>
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {project.category.slice(0, 2).map((c) => (
            <Badge key={c} variant="muted" className="px-1.5 py-0.5 text-[8px] tracking-[0.1em] sm:px-2 sm:py-0.5 sm:text-[10px] sm:tracking-[0.12em]">
              {c}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
