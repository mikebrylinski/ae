import { useMemo, useState } from 'react'
import { experience, getAllCategories, getProjectsByCategory } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { ProjectCard } from '@/components/sections/ProjectCard'
import { CreditsTimeline } from '@/components/sections/CreditsTimeline'
import { CTABanner } from '@/components/sections/CTABanner'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'

export default function PortfolioPage() {
  useSeo({
    title: 'Portfolio',
    description:
      'Selected career credits for monitor engineer Andy Ebert — arena and stadium tours with year ranges from 1997 to today.',
  })

  const categories = useMemo(() => getAllCategories(), [])
  const [active, setActive] = useState('All')
  const filtered = getProjectsByCategory(active)

  return (
    <>
      <section className="section-pad border-b border-border bg-black">
        <Container>
          <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
            Credits
          </p>
          <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl md:text-6xl">
            Portfolio
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Selected arena, stadium, and touring credits — consecutive years
            collapsed into ranges. Alanis Morissette, The Weeknd, Maroon 5,
            Guns N’ Roses, and more.
          </p>
          {experience.award ? (
            <p className="font-heading mt-6 max-w-2xl text-sm tracking-[0.12em] text-primary">
              {experience.award}
            </p>
          ) : null}

          <div className="mt-14 md:mt-16">
            <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
              Selected
            </p>
            <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
              Project Spotlights
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Deeper looks at key tours and productions.
            </p>

            <div
              className="mt-10 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active === cat}
                  onClick={() => setActive(cat)}
                  className={cn(
                    'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
                    active === cat
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>

            {filtered.length === 0 ? (
              <p className="mt-12 text-muted">No projects in this category yet.</p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="section-pad border-b border-border bg-black">
        <Container>
          <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
            Timeline
          </p>
          <h2 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
            Career Credits
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Arena, stadium, and touring highlights by year — filter by monitors
            or FOH.
          </p>

          <div className="mt-10">
            <CreditsTimeline />
          </div>
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
