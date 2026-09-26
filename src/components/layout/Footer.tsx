import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useId } from 'react'
import { flattenNav, getNav } from '@/lib/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import { Container } from '@/components/ui/Container'
import { VuPair } from '@/components/ui/VuPair'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'
import { RackScrew } from '@/components/ui/Screws'
import { fadeUp, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function AllAccessLaminate() {
  return (
    <div className="all-access" aria-hidden>
      <span className="all-access__clip" />
      <span className="all-access__hole" />
      <div className="all-access__pass">
        <span className="all-access__sheen" />
        <p className="all-access__kicker">Tour</p>
        <p className="all-access__title">All Access</p>
        <p className="all-access__area">Admin Area</p>
      </div>
    </div>
  )
}

export function VeganLaminate() {
  const { lang, t } = useLanguage()
  const ringId = `vegan-laminate-ring-${useId().replace(/:/g, '')}`

  return (
    <a
      href="https://plantpoweredroadie.com"
      target="_blank"
      rel="noopener noreferrer"
      className="all-access vegan-laminate"
    >
      <span className="all-access__clip" aria-hidden />
      <span className="all-access__hole" aria-hidden />
      <div className="all-access__pass">
        <svg className="vegan-laminate__ring" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <path
              id={ringId}
              fill="none"
              d="M50,9 a41,41 0 1,1 0,82 a41,41 0 1,1 0,-82"
            />
          </defs>
          <text
            className="vegan-laminate__ring-text"
            dominantBaseline="central"
            style={lang === 'de' ? { fontSize: '8.5px' } : undefined}
          >
            <textPath
              href={`#${ringId}`}
              startOffset="0%"
              textLength="258"
              lengthAdjust="spacing"
            >
              {t.brand.plantsRing}
            </textPath>
          </text>
        </svg>
        <img
          src="/images/brand/vegan-logo.png"
          alt={t.brand.roadie}
          width={135}
          height={135}
          className="vegan-laminate__logo"
          decoding="async"
        />
      </div>
    </a>
  )
}

export function Footer({ admin = false }: { admin?: boolean }) {
  const year = new Date().getFullYear()
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const { lang, t } = useLanguage()
  const links = flattenNav(getNav(lang))

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <footer className="rack-footer relative overflow-visible">
      <MeshBackdrop className="rack-footer__mesh" />

      <div className="rack-faceplate" aria-hidden>
        <div className="rack-ear rack-ear--left">
          <RackScrew drive="phillips" angle={-11} />
          <RackScrew angle={52} />
          <RackScrew drive="phillips" angle={-71} />
        </div>
        <div className="rack-ear rack-ear--right">
          <RackScrew angle={-44} />
          <RackScrew drive="phillips" angle={9} />
          <RackScrew angle={38} />
        </div>
        <span className="rack-rivet rack-rivet--tl" />
        <span className="rack-rivet rack-rivet--tr" />
        <span className="rack-rivet rack-rivet--bl" />
        <span className="rack-rivet rack-rivet--br" />
        <div className="rack-faceplate__vent rack-faceplate__vent--footer" />
        <div className="rack-faceplate__edge rack-faceplate__edge--top" />
      </div>

      <Container className="relative z-10 py-10 md:py-12">
        <motion.div
          className="flex flex-col gap-8 text-center md:gap-10 md:text-left"
          variants={item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {admin ? (
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-3 sm:gap-4 md:justify-start">
                <div className="rack-brand-wrap rack-brand-wrap--no-seal rack-brand-glow min-w-0">
                  <Link
                    to="/"
                    className="rack-brand rack-brand--glow inline-flex max-w-full min-w-0 flex-col items-center gap-0.5 text-center"
                  >
                    <span className="rack-brand__shine" aria-hidden />
                    <span className="rack-brand__name whitespace-nowrap font-heading text-[clamp(1.75rem,8vw,2.25rem)] tracking-[0.1em] sm:text-5xl sm:tracking-[0.12em] md:text-6xl">
                      <span className="text-white">ANDY</span>{' '}
                      <span className="text-primary">EBERT</span>
                    </span>
                    <span className="rack-brand__sub w-full font-heading text-[0.75rem] uppercase text-muted sm:text-sm">
                      {t.brand.subtitle}
                    </span>
                    <span className="font-heading mt-0.5 text-[0.62rem] tracking-[0.22em] text-primary uppercase sm:text-[0.7rem]">
                      Admin Area
                    </span>
                  </Link>
                </div>
                <AllAccessLaminate />
              </div>
              <div className="flex w-full flex-col items-center gap-4 md:w-auto md:items-end md:text-right">
                <VuPair />
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="footer-brand-stack flex flex-col items-center gap-3 md:gap-4">
                <div className="rack-brand-wrap rack-brand-wrap--no-seal rack-brand-glow min-w-0">
                  <Link
                    to="/"
                    className="rack-brand rack-brand--glow inline-flex max-w-full min-w-0 flex-col items-center gap-0.5 text-center"
                  >
                    <span className="rack-brand__shine" aria-hidden />
                    <span className="rack-brand__name whitespace-nowrap font-heading text-[clamp(1.75rem,8vw,2.25rem)] tracking-[0.1em] sm:text-5xl sm:tracking-[0.12em] md:text-6xl">
                      <span className="text-white">ANDY</span>{' '}
                      <span className="text-primary">EBERT</span>
                    </span>
                    <span className="rack-brand__sub w-full font-heading text-[0.75rem] uppercase text-muted sm:text-sm">
                      {t.brand.subtitle}
                    </span>
                  </Link>
                </div>
                <div className="flex shrink-0 items-center justify-center">
                  <VeganLaminate />
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-center md:w-auto md:justify-end">
                <VuPair />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
            <nav aria-label={t.a11y.footerNav}>
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 md:justify-start">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="rack-footer__link font-heading inline-flex min-h-11 items-center text-[0.65rem] tracking-[0.16em] text-muted transition-colors duration-500 hover:text-primary"
                    >
                      {link.label.toUpperCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              type="button"
              onClick={scrollTop}
              className="rack-footer__link font-heading inline-flex min-h-11 items-center gap-2 text-[0.65rem] tracking-[0.16em] text-muted transition-colors duration-500 hover:text-primary"
              aria-label={t.a11y.backToTop}
            >
              {t.footer.backToTop.toUpperCase()}
              <ArrowUp size={14} strokeWidth={1.5} className="text-primary" />
            </button>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-5 text-center text-xs text-muted lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p>© {year} Andy Ebert. {t.footer.rights}</p>
          <p className="font-heading flex w-full flex-wrap items-center justify-center gap-2 tracking-[0.14em] lg:w-auto lg:justify-end">
            <span>{t.footer.siteBy}</span>
            <a
              href="https://mikebweb.dev/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MIKEBWEB.dev"
              className="group relative inline-flex min-h-9 items-center gap-1.5 border border-white/20 bg-white/[0.04] px-2.5 py-1.5 font-bold leading-none tracking-[-0.03em] text-sm text-muted normal-case transition-[border-color,background-color,color] duration-500 hover:border-[#3B8CFF]/70 hover:bg-[#06101c] hover:text-[#3B8CFF] focus-visible:border-[#3B8CFF]/70 focus-visible:bg-[#06101c] focus-visible:text-[#3B8CFF] focus-visible:outline-none"
            >
              <span className="pointer-events-none absolute inset-0" aria-hidden>
                <span className="absolute top-0 left-0 h-1.5 w-1.5 border border-r-0 border-b-0 border-white/35 transition-colors duration-500 group-hover:border-[#3B8CFF]/80 group-focus-visible:border-[#3B8CFF]/80" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 border border-b-0 border-l-0 border-white/35 transition-colors duration-500 group-hover:border-[#3B8CFF]/80 group-focus-visible:border-[#3B8CFF]/80" />
                <span className="absolute bottom-0 left-0 h-1.5 w-1.5 border border-t-0 border-r-0 border-white/35 transition-colors duration-500 group-hover:border-[#3B8CFF]/80 group-focus-visible:border-[#3B8CFF]/80" />
                <span className="absolute right-0 bottom-0 h-1.5 w-1.5 border border-t-0 border-l-0 border-white/35 transition-colors duration-500 group-hover:border-[#3B8CFF]/80 group-focus-visible:border-[#3B8CFF]/80" />
              </span>
              <span className="inline-flex items-center font-mono text-[0.95em] font-medium tracking-[0.08em] text-muted transition-colors duration-500 group-hover:text-[#3B8CFF] group-focus-visible:text-[#3B8CFF]" aria-hidden>
                <span>&lt;</span>
                <span className="mikebweb-mark__slash inline-block">/</span>
                <span>&gt;</span>
              </span>
              <span className="inline-flex items-baseline">
                <span className="text-muted transition-colors duration-500 group-hover:text-white group-focus-visible:text-white">MIKEBWEB</span>
                <span className="text-muted transition-colors duration-500 group-hover:text-[#3B8CFF] group-focus-visible:text-[#3B8CFF]">.dev</span>
              </span>
            </a>
          </p>
        </div>
      </Container>
    </footer>
  )
}
