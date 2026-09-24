import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageProvider'
import { getCountlessArtistsRoster } from '@/lib/content'
import { persistCreditsView, readStoredCreditsView } from '@/lib/creditsView'
import { cn } from '@/lib/utils'

function ArtistLink({
  name,
  slug,
  href,
}: {
  name: string
  slug?: string
  href?: string
}) {
  const className = cn(
    'font-heading inline-flex max-w-full items-center gap-1 text-sm tracking-[0.04em] text-primary transition-colors hover:text-primary/80 sm:text-base',
  )

  if (slug) {
    return (
      <Link
        to={`/portfolio/${slug}`}
        state={readStoredCreditsView()}
        onClick={() => persistCreditsView(readStoredCreditsView())}
        className={className}
      >
        <span className="min-w-0 break-words">{name}</span>
        <ArrowUpRight size={14} strokeWidth={1.8} className="shrink-0" aria-hidden />
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <span className="min-w-0 break-words">{name}</span>
        <ArrowUpRight size={14} strokeWidth={1.8} className="shrink-0" aria-hidden />
      </a>
    )
  }

  return <span className="text-sm text-foreground/90 sm:text-base">{name}</span>
}

export function CountlessArtistsRoster({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const roster = getCountlessArtistsRoster(lang)

  return (
    <div className={cn('min-w-0 space-y-8', className)}>
      <p className="text-base leading-relaxed break-words text-foreground/90">{roster.intro}</p>

      {roster.groups.map((group) => (
        <section key={group.heading} className="min-w-0 space-y-5">
          <h3 className="font-heading text-sm tracking-[0.16em] text-primary uppercase">
            {group.heading}
          </h3>

          {group.regions.map((region, regionIndex) => (
            <div
              key={`${group.heading}-${region.heading ?? regionIndex}`}
              className="min-w-0 space-y-3"
            >
              {region.heading ? (
                <h4 className="font-heading text-xs tracking-[0.14em] text-muted uppercase">
                  {region.heading}
                </h4>
              ) : null}
              <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
                {region.artists.map((artist) => (
                  <li
                    key={artist.name}
                    className="min-w-0 border-l-2 border-primary/50 pl-3"
                  >
                    <ArtistLink
                      name={artist.name}
                      slug={artist.slug}
                      href={artist.href}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
