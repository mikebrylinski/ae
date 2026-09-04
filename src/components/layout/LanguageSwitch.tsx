import { useLanguage } from '@/i18n/LanguageProvider'
import { LangFlag } from '@/components/ui/LangFlag'
import { cn } from '@/lib/utils'
import type { Language } from '@/i18n/types'

const OPTIONS: { id: Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'de', label: 'DE' },
]

export function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="lang-switch" role="group" aria-label={t.lang.label}>
      <span className="lang-switch__leds" aria-hidden>
        {OPTIONS.map((opt) => (
          <span
            key={opt.id}
            className={cn('lang-switch__led', lang === opt.id && 'is-on')}
          />
        ))}
      </span>

      <div className="lang-switch__face">
        <span
          className={cn(
            'lang-switch__thumb',
            lang === 'de' && 'lang-switch__thumb--de',
          )}
          aria-hidden
        />
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={cn('lang-switch__opt', lang === opt.id && 'is-active')}
            aria-pressed={lang === opt.id}
            aria-label={opt.id === 'en' ? t.lang.en : t.lang.de}
            onClick={() => setLang(opt.id)}
          >
            <LangFlag lang={opt.id} />
            <span className="lang-switch__opt-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
