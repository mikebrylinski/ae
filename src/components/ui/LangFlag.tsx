import type { Language } from '@/i18n/types'

function UsFlag() {
  return (
    <svg viewBox="0 0 19 10" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="19" height="10" fill="#b22234" />
      <rect y="0.77" width="19" height="0.77" fill="#fff" />
      <rect y="2.31" width="19" height="0.77" fill="#fff" />
      <rect y="3.85" width="19" height="0.77" fill="#fff" />
      <rect y="5.38" width="19" height="0.77" fill="#fff" />
      <rect y="6.92" width="19" height="0.77" fill="#fff" />
      <rect y="8.46" width="19" height="0.77" fill="#fff" />
      <rect width="7.6" height="5.38" fill="#3c3b6e" />
    </svg>
  )
}

function DeFlag() {
  return (
    <svg viewBox="0 0 5 3" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#dd0000" />
      <rect y="2" width="5" height="1" fill="#ffce00" />
    </svg>
  )
}

export function LangFlag({ lang }: { lang: Language }) {
  return (
    <span className="lang-flag" aria-hidden>
      {lang === 'de' ? <DeFlag /> : <UsFlag />}
    </span>
  )
}
