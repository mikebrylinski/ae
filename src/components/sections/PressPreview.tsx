import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { getPressItems, localizePressType, pressAnchorProps, pressHref } from '@/lib/content'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useLanguage } from '@/i18n/LanguageProvider'
import type { PressItem } from '@/types'

const PREVIEW_COUNT = 3

function getPreviewPressItems(limit = PREVIEW_COUNT): PressItem[] {
  const items = getPressItems()
  const withHref = items.filter((item) => pressHref(item))
  if (withHref.length >= limit) return withHref.slice(0, limit)
  const seen = new Set(withHref.map((item) => item.id))
  return [...withHref, ...items.filter((item) => !seen.has(item.id))].slice(
    0,
    limit,
  )
}

export function PressPreview() {
  const { lang, t } = useLanguage()
  const items = getPreviewPressItems()
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp

  return (
    <section
      className="section-divider-top bg-black py-20 sm:py-24 md:py-28 lg:py-32"
      aria-labelledby="press-heading"
    >
      <Container>
        <SectionHeading
          id="press-heading"
          eyebrow={t.pressPreview.eyebrow}
          title={t.pressPreview.title}
          align="left"
          action={
            <Link
              to="/media"
              className="font-heading text-xs tracking-[0.16em] text-primary transition-opacity duration-500 hover:opacity-80"
            >
              {t.pressPreview.viewAll}
            </Link>
          }
        />

        <motion.ul
          className="grid gap-4 md:grid-cols-3 md:gap-6"
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {items.map((pressItem) => {
            const link = pressAnchorProps(pressItem)
            const meta = [pressItem.publication, pressItem.date]
              .filter(Boolean)
              .join(' · ')
            const body = (
              <>
                {pressItem.image ? (
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black">
                    <img
                      src={pressItem.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15"
                      aria-hidden
                    />
                  </div>
                ) : (
                  <div
                    className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-white/10 bg-black"
                    aria-hidden
                  >
                    <div className="spotlight-empty-grid absolute inset-0 opacity-70" />
                    <FileText
                      size={28}
                      strokeWidth={1.4}
                      className="relative text-white/25"
                    />
                  </div>
                )}
                <div className="p-5 md:p-6">
                  <Badge variant="muted">{localizePressType(pressItem.type, lang)}</Badge>
                  <h3 className="mt-3 font-heading text-lg tracking-[0.06em] text-white transition-colors duration-500 group-hover:text-primary">
                    {pressItem.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{meta}</p>
                  <p className="mt-3 text-sm text-foreground/80">
                    {pressItem.excerpt}
                  </p>
                </div>
              </>
            )

            return (
              <motion.li
                key={pressItem.id}
                variants={item}
                className="glass-card overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(184,255,0,0.06)]"
              >
                {link ? (
                  <a {...link} className="group block h-full">
                    {body}
                  </a>
                ) : (
                  <Link to="/media" className="group block h-full">
                    {body}
                  </Link>
                )}
              </motion.li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
