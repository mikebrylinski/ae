import { useId } from 'react'

export function VeganSeal() {
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
        <text className="rack-brand__vegan-ring-text">
          <textPath href={`#${ringId}`} startOffset="0%" textLength="264" lengthAdjust="spacing">
            PROUDLY PLANT POWERED • PROUDLY PLANT POWERED •
          </textPath>
        </text>
      </svg>
      <img
        src="/images/brand/vegan-logo.png"
        alt="Proudly plant powered"
        width={135}
        height={135}
        className="rack-brand__vegan-icon"
      />
    </span>
  )
}
