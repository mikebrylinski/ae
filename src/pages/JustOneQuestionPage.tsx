import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { CTABanner } from '@/components/sections/CTABanner'
import { PortfolioAurora } from '@/components/ui/PortfolioAurora'
import { mediaPressLocation } from '@/lib/pressView'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

const COVER_IMAGE = '/images/press/cards/just-100-questions.jpg'
const PAGE_IMAGE = '/images/press/cards/just-100-questions-andy.jpg'
const BUY_URL =
  'https://www.guesthouseprojects.com/store/just100questionsbook'

export default function JustOneQuestionPage() {
  const { t } = useLanguage()
  const copy = t.justOneQuestion

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    image: COVER_IMAGE,
  })

  return (
    <>
      <div className="relative isolate min-w-0 overflow-hidden bg-black">
        <PortfolioAurora />

        <section
          className="relative z-10 w-full min-w-0 overflow-hidden border-b border-border"
          aria-label={copy.title}
        >
          <div className="absolute inset-0" aria-hidden>
            <img
              src={COVER_IMAGE}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          </div>

          <Container className="relative z-10 max-w-5xl py-8 md:py-12">
            <Link
              to={mediaPressLocation()}
              className="font-heading inline-flex items-center gap-2 rounded-[1rem] border border-primary/40 bg-black/30 px-3 py-1.5 text-xs tracking-[0.14em] text-primary backdrop-blur-sm transition-colors hover:border-primary hover:opacity-90"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              {copy.back}
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-2 sm:mt-10">
              <Badge variant="muted">{copy.badge}</Badge>
              <p className="text-sm text-white/70">{copy.meta}</p>
            </div>

            <h1 className="font-heading mt-4 text-3xl tracking-[0.06em] text-white sm:text-4xl md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
              {copy.subtitle}
            </p>
          </Container>
        </section>

        <section className="relative z-10 border-b border-border pb-[clamp(4rem,8vw,7rem)] pt-10 md:pt-14">
          <Container className="max-w-5xl">
            <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">
              {copy.introBefore}
              <a
                href={copy.introCompanyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
              >
                {copy.introCompany}
              </a>
              {copy.introAfter}
            </p>

            <figure className="glass-card mt-8 overflow-hidden p-0 sm:mt-10">
              <img
                src={PAGE_IMAGE}
                alt={copy.imageAlt}
                className="mx-auto block h-auto w-full bg-white object-contain"
                loading="eager"
                decoding="async"
              />
            </figure>

            <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
              <div>
                <p className="font-heading text-xs tracking-[0.16em] text-primary uppercase">
                  {copy.subjectLabel}
                </p>
                <p className="mt-2 text-xl text-white">{copy.subjectName}</p>
                <p className="mt-1 text-sm text-muted">{copy.subjectMeta}</p>
              </div>

              <div className="min-w-0">
                <p className="font-heading text-xs tracking-[0.16em] text-primary uppercase">
                  {copy.questionLabel}
                </p>
                <blockquote className="mt-3 text-base leading-relaxed text-white/90 italic sm:text-lg">
                  {copy.question}
                </blockquote>
                <p className="mt-6 text-base leading-relaxed text-foreground/85">
                  {copy.answer}
                </p>
              </div>
            </div>

            <a
              href={BUY_URL}
              target="_blank"
              rel="noreferrer"
              className="glass-card group mt-12 grid overflow-hidden p-0 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_0_28px_rgba(184,255,0,0.08)] sm:mt-14 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden border-b border-white/10 bg-white sm:aspect-auto sm:min-h-[16rem] sm:border-b-0 sm:border-r">
                <img
                  src={COVER_IMAGE}
                  alt={copy.coverAlt}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="font-heading text-xs tracking-[0.16em] text-primary uppercase">
                  {copy.buyEyebrow}
                </p>
                <h2 className="font-heading mt-3 text-2xl tracking-[0.06em] text-white transition-colors group-hover:text-primary sm:text-3xl">
                  {copy.buyTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
                  {copy.buyBody}
                </p>
                <span
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'default' }),
                    'mt-6 w-fit',
                  )}
                >
                  {copy.buyCta}
                  <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden />
                </span>
              </div>
            </a>
          </Container>
        </section>
      </div>
      <CTABanner />
    </>
  )
}
