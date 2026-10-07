import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { CTABanner } from '@/components/sections/CTABanner'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'
import { mediaPressLocation } from '@/lib/pressView'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'

const PAGE_IMAGE = '/images/press/cards/hittin-ezine.jpg'

const CLIPS = [
  {
    id: 'ultimate-ears',
    url: 'https://www.youtube.com/watch?v=7SPAL08j0mU',
    duration: '2:43',
  },
  {
    id: 'road-duties',
    url: 'https://www.youtube.com/watch?v=wYNvxhshM6w',
    duration: '3:00',
  },
  {
    id: 'premixing',
    url: 'https://www.youtube.com/watch?v=drZ-usLiJCE',
    duration: '1:28',
  },
  {
    id: 'engineers-advice',
    url: 'https://www.youtube.com/watch?v=qjUyazL0-NI',
    duration: '5:33',
  },
] as const

export default function HittinEzinePage() {
  const { t } = useLanguage()
  const copy = t.hittinEzine

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    image: PAGE_IMAGE,
  })

  return (
    <>
      <div className="relative isolate min-w-0 overflow-hidden bg-black">
        <PortfolioAurora />

        <section className="relative z-10 border-b border-border pb-[clamp(4rem,8vw,7rem)] pt-8 md:pt-12">
          <Container className="max-w-5xl">
            <Link
              to={mediaPressLocation()}
              className="font-heading inline-flex items-center gap-2 rounded-[1rem] border border-primary/40 px-3 py-1.5 text-xs tracking-[0.14em] text-primary transition-colors hover:border-primary hover:opacity-90"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              {copy.back}
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-2 sm:mt-10">
              <Badge variant="muted">{copy.badge}</Badge>
              <p className="text-sm text-muted">{copy.meta}</p>
            </div>

            <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-end md:gap-10">
              <figure className="glass-card overflow-hidden p-0">
                <img
                  src={PAGE_IMAGE}
                  alt={copy.imageAlt}
                  className="aspect-square w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </figure>

              <div className="min-w-0">
                <h1 className="font-heading text-3xl tracking-[0.06em] text-white sm:text-4xl md:text-5xl">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-foreground/80 sm:text-lg">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-10 sm:mt-12">
              <p className="font-heading text-xs tracking-[0.16em] text-primary uppercase">
                {copy.clipsLabel}
              </p>
              <ul className="mt-4 grid gap-3 sm:gap-4">
                {CLIPS.map((clip) => {
                  const clipCopy = copy.clips[clip.id]
                  return (
                    <li key={clip.id}>
                      <a
                        href={clip.url}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-card group flex items-center gap-4 p-4 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)] sm:gap-5 sm:p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-base tracking-[0.04em] text-white transition-colors group-hover:text-primary sm:text-lg">
                            {clipCopy.title}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {clipCopy.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="font-heading text-[10px] tracking-[0.14em] text-muted uppercase">
                            {clip.duration}
                          </span>
                          <span className="font-heading inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-primary uppercase">
                            {copy.watch}
                            <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
                          </span>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Container>
        </section>
      </div>
      <CTABanner />
    </>
  )
}
