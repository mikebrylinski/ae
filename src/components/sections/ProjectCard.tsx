import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import { Badge } from '@/components/ui/Badge'
import {
  getChartVenueChips,
  localizeCategory,
  localizeProject,
} from '@/lib/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { lang } = useLanguage()
  const localized = localizeProject(project, lang)
  const chips = getChartVenueChips(project.category)
  const bg = project.cardImage

  return (
    <Link
      to={`/portfolio/${project.slug}`}
      className="card-lift group block rounded-[1rem] focus-visible:outline-none"
    >
      <div
        className={cn(
          'relative flex aspect-[5/4] flex-col items-center justify-center overflow-hidden rounded-[1rem] border border-border bg-black px-2.5 py-3 text-center transition-[transform,box-shadow,border-color] duration-700 ease-out group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_0_28px_rgba(184,255,0,0.08)] sm:aspect-[4/3] sm:px-4 sm:py-5',
        )}
      >
        {bg ? (
          <>
            <img
              src={bg}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35"
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative z-[1] min-w-0 max-w-full">
          <h3 className="font-heading text-sm leading-tight tracking-[0.04em] text-white transition-colors duration-500 group-hover:text-primary sm:text-lg md:text-xl">
            {project.artist}
          </h3>
          <p className="mt-1 text-[9px] leading-snug tracking-[0.1em] text-white/75 uppercase sm:mt-2 sm:text-[11px] sm:tracking-[0.12em]">
            {localized.year}
            <span className="mx-1 text-white/35 sm:mx-1.5" aria-hidden>
              ·
            </span>
            {localized.role}
          </p>
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {chips.map((c) => (
            <Badge
              key={c}
              variant="muted"
              className="px-1.5 py-0.5 text-[8px] tracking-[0.1em] sm:px-2 sm:py-0.5 sm:text-[10px] sm:tracking-[0.12em]"
            >
              {localizeCategory(c, lang)}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
