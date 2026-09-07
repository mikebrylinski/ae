import { useId } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'

export function VeganSeal({ alt }: { alt?: string }) {
  const { lang, t } = useLanguage()
  const ringId = `vegan-ring-${useId().replace(/:/g, '')}`

  return (
    <span className="rack-brand__vegan-mark">
      <svg
        className="rack-brand__vegan-ring"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <path
            id={ringId}
            fill="none"
            d="M50,8 a42,42 0 1,1 0,84 a42,42 0 1,1 0,-84"
          />
        </defs>
        <text
          className="rack-brand__vegan-ring-text"
          style={lang === 'de' ? { fontSize: '9px' } : undefined}
        >
          <textPath href={`#${ringId}`} startOffset="0%" textLength="264" lengthAdjust="spacing">
            {t.brand.plantsRing}
          </textPath>
        </text>
      </svg>
      <img
        src="/images/brand/vegan-logo.png"
        alt={alt ?? t.brand.plants}
        width={135}
        height={135}
        className="rack-brand__vegan-icon"
        loading="lazy"
        decoding="async"
      />
    </span>
  )
}
