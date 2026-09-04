import { useEffect } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import { setSeo, type SeoConfig } from '@/lib/seo'

export function useSeo(config: SeoConfig) {
  const { lang } = useLanguage()

  useEffect(() => {
    setSeo(config)
  }, [config.title, config.description, config.noIndex, lang])
}
