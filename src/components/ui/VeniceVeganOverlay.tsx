import { useId } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import { CtaSpectrum } from '@/components/ui/CtaSpectrum'

export function VeniceVeganOverlay() {
  const { lang, t } = useLanguage()
  const ringId = `venice-vegan-ring-${useId().replace(/:/g, '')}`

  return (
    <div className="venice-vegan" aria-hidden>
      <CtaSpectrum />

      <div className="venice-vegan__seal">
        <span className="venice-vegan__glow" />
        <svg className="venice-vegan__ring" viewBox="0 0 100 100">
          <defs>
            <path
              id={ringId}
              fill="none"
              d="M50,8 a42,42 0 1,1 0,84 a42,42 0 1,1 0,-84"
            />
          </defs>
          <text
            className="venice-vegan__ring-text"
            style={lang === 'de' ? { fontSize: '9px' } : undefined}
          >
            <textPath
              href={`#${ringId}`}
              startOffset="0%"
              textLength="264"
              lengthAdjust="spacing"
            >
              {t.brand.plantsRing}
            </textPath>
          </text>
        </svg>
        <span className="venice-vegan__icon-wrap">
          <img
            src="/images/brand/vegan-logo.png"
            alt=""
            width={135}
            height={135}
            className="venice-vegan__icon"
            loading="lazy"
            decoding="async"
          />
        </span>
      </div>
    </div>
  )
}
