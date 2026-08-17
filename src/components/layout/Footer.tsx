import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { flattenNav } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { VuPair } from '@/components/ui/VuPair'
import { VeganSeal } from '@/components/ui/VeganSeal'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'
import { RackScrew } from '@/components/ui/Screws'
import { fadeUp, reducedMotionVariants } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function Footer() {
  const year = new Date().getFullYear()
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

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

      <Container className="relative z-10 py-10 md:py-12 lg:px-12 xl:px-14">
        <motion.div
          className="flex flex-col items-center gap-10 text-center md:flex-row md:items-center md:justify-between md:text-left"
          variants={item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          <div className="flex flex-col items-center gap-6 md:items-start">
            <div className="flex w-max flex-col items-center gap-2">
              <div className="rack-brand-wrap rack-brand-wrap--lg">
                <VeganSeal />
                <Link
                  to="/"
                  className="rack-brand inline-flex flex-col items-center gap-0.5 text-center"
                >
                  <span className="rack-brand__shine" aria-hidden />
                  <span className="rack-brand__name whitespace-nowrap font-heading text-3xl tracking-[0.12em] sm:text-4xl md:text-5xl">
                    <span className="text-white">ANDY</span>{' '}
                    <span className="text-primary">EBERT</span>
                  </span>
                  <span className="rack-brand__sub w-full font-heading text-[0.7rem] uppercase text-muted sm:text-xs">
                    Sound Engineer
                  </span>
                </Link>
              </div>
              <p className="rack-brand-caption font-heading text-[0.65rem] tracking-[0.18em] text-muted sm:text-[0.7rem]">
                proudly powered by plants
              </p>
            </div>

            <nav aria-label="Footer">
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 md:justify-start">
                {flattenNav().map((link) => (
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
          </div>

          <div className="flex w-full flex-col items-center gap-4 md:ml-auto md:w-auto md:items-end md:text-right">
            <VuPair />
            <button
              type="button"
              onClick={scrollTop}
              className="rack-footer__link font-heading inline-flex min-h-11 items-center gap-2 text-[0.65rem] tracking-[0.16em] text-muted transition-colors duration-500 hover:text-primary"
              aria-label="Back to top"
            >
              BACK TO TOP
              <ArrowUp size={14} strokeWidth={1.5} className="text-primary" />
            </button>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-5 text-center text-xs text-muted lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p>© {year} Andy Ebert. All Rights Reserved.</p>
          <p className="font-heading w-full tracking-[0.14em] lg:w-auto lg:text-right">
            Site by Pixel Palisade
          </p>
        </div>
      </Container>
    </footer>
  )
}
