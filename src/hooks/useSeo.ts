import { useEffect } from 'react'
import { setSeo, type SeoConfig } from '@/lib/seo'

export function useSeo(config: SeoConfig) {
  useEffect(() => {
    setSeo(config)
  }, [config.title, config.description, config.noIndex])
}
