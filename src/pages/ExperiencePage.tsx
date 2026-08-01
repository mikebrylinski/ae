import { experience } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { CTABanner } from '@/components/sections/CTABanner'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'

export default function ExperiencePage() {
  useSeo({
    title: 'Experience',
    description:
      'Career timeline and resume for monitor engineer Andy Ebert — Alanis Morissette, The Weeknd, Maroon 5, Guns N’ Roses, and more.',
  })

  return (
    <>
      <section className="section-pad bg-black">
        <Container>
          <p className="font-heading mb-3 text-xs tracking-[0.2em] text-primary">
            Career
          </p>
          <h1 className="font-heading text-4xl tracking-[0.08em] text-white sm:text-5xl md:text-6xl">
            Experience
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{experience.resumeSummary}</p>
          {experience.award ? (
            <p className="font-heading mt-6 max-w-2xl text-sm tracking-[0.12em] text-primary">
              {experience.award}
            </p>
          ) : null}
          <a
            href={experience.resumePdf}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-8 inline-flex')}
          >
            Download Resume
          </a>

          <div className="mt-16 space-y-0 border-l border-border">
            {experience.timeline.map((entry) => (
              <article
                key={`${entry.year}-${entry.tour}`}
                className="relative grid gap-6 border-b border-border py-10 pl-8 md:grid-cols-[1fr_1.2fr] md:pl-12"
              >
                <span
                  className="absolute top-12 -left-[5px] h-2.5 w-2.5 bg-primary"
                  aria-hidden
                />
                <div>
                  <p className="font-heading text-sm tracking-[0.16em] text-primary">
                    {entry.year}
                  </p>
                  <h2 className="font-heading mt-2 text-2xl tracking-[0.06em] text-white">
                    {entry.tour}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{entry.artist}</p>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                    {entry.description}
                  </p>
                </div>
                <MediaImage
                  src={entry.photo}
                  alt={entry.tour}
                  aspect="aspect-video"
                  fallbackLabel={entry.tour}
                />
              </article>
            ))}
          </div>

          <div className="mt-20">
            <h2 className="font-heading mb-10 text-3xl tracking-[0.08em] text-white">
              Skills
            </h2>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {experience.skills.map((group) => (
                <li key={group.title}>
                  <h3 className="font-heading mb-4 text-sm tracking-[0.14em] text-primary">
                    {group.title}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li key={item}>
                        <Badge variant="muted">{item}</Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <CTABanner />
    </>
  )
}
