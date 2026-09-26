import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '@/i18n/LanguageProvider'
import { setSeo, type SeoConfig } from '@/lib/seo'

export function useSeo({ title, description, noIndex, image, path }: SeoConfig) {
  const { lang } = useLanguage()
  const { pathname } = useLocation()

  useEffect(() => {
    setSeo({
      title,
      description,
      noIndex,
      image,
      path: path ?? pathname,
      lang,
    })
  }, [title, description, noIndex, image, path, pathname, lang])
}
