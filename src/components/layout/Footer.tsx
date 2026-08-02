import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { flattenNav } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'
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
    <footer className="rack-footer relative overflow-hidden">
      <MeshBackdrop className="rack-footer__mesh" />

      <div className="rack-faceplate" aria-hidden>
        <div className="rack-ear rack-ear--left">
          <span className="rack-screw" />
          <span className="rack-screw" />
          <span className="rack-screw" />
        </div>
        <div className="rack-ear rack-ear--right">
          <span className="rack-screw" />
          <span className="rack-screw" />
          <span className="rack-screw" />
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
            <Link
              to="/"
              className="rack-brand inline-flex flex-col items-center gap-0.5 text-center"
            >
              <span className="rack-brand__sub w-full font-heading text-[0.7rem] uppercase text-muted sm:text-xs">
                Sound Engineer
              </span>
              <span className="rack-brand__name whitespace-nowrap font-heading text-3xl tracking-[0.12em] sm:text-4xl md:text-5xl">
                <span className="text-white">ANDY</span>{' '}
                <span className="text-primary">EBERT</span>
              </span>
            </Link>

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

          <div className="flex flex-col items-center gap-4 md:ml-auto md:items-end md:text-right">
            <div
              className="flex flex-col items-center gap-2 md:items-end"
              role="img"
              aria-label="Vegan — proudly powered by plants"
            >
              <img
                src="/images/brand/vegan-logo.png"
                alt=""
                width={284}
                height={284}
                className="h-14 w-14 object-contain sm:h-16 sm:w-16"
              />
              <p className="text-center font-heading text-[0.65rem] tracking-[0.18em] text-muted sm:text-[0.7rem] md:text-right">
                proudly powered by plants
              </p>
            </div>

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

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-muted md:text-left">
          <p>© {year} Andy Ebert. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}
