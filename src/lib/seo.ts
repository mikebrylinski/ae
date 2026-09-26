/**
 * SEO helpers — document title, description, canonical, Open Graph, and JSON-LD.
 */

import type { Language } from '@/i18n/types'

export const SITE_NAME = 'Andy Ebert'
export const SITE_URL = 'https://andyebert.com'
export const DEFAULT_DESCRIPTION =
  'When artists need to hear perfection. Worldwide touring sound engineer, professionally since ’97 — Alanis Morissette, The Weeknd, Neil Young, Guns N’ Roses, Maroon 5, Mariah Carey, and more.'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/sections/cta-portrait.jpg`

export interface SeoConfig {
  title: string
  description?: string
  noIndex?: boolean
  path?: string
  image?: string
  lang?: Language
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    if (hreflang) el.setAttribute('hreflang', hreflang)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeHreflang() {
  document
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove())
}

function removeCanonical() {
  document.querySelector('link[rel="canonical"]')?.remove()
}

export function pageUrl(path: string, lang: Language = 'en') {
  const clean = path.startsWith('/') ? path : `/${path}`
  const url = `${SITE_URL}${clean}`
  return lang === 'de' ? `${url}?lang=de` : url
}

function absoluteImage(image?: string) {
  if (!image) return DEFAULT_OG_IMAGE
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`
}

function setJsonLd(payload: unknown | null) {
  const existing = document.getElementById('seo-jsonld')
  if (!payload) {
    existing?.remove()
    return
  }
  const script = existing ?? document.createElement('script')
  script.id = 'seo-jsonld'
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(payload)
  if (!existing) document.head.appendChild(script)
}

export function setSeo({
  title,
  description,
  noIndex = false,
  path = '/',
  image,
  lang = 'en',
}: SeoConfig) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const summary = description?.trim() || DEFAULT_DESCRIPTION
  const canonical = pageUrl(path, lang)
  const imageUrl = absoluteImage(image)
  const locale = lang === 'de' ? 'de_DE' : 'en_US'

  document.title = fullTitle
  document.documentElement.lang = lang

  upsertMeta('name', 'description', summary)
  upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', summary)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', locale)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', imageUrl)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', fullTitle)
  upsertMeta('name', 'twitter:description', summary)
  upsertMeta('name', 'twitter:image', imageUrl)

  if (noIndex) {
    removeCanonical()
    removeHreflang()
    setJsonLd(null)
    return
  }

  upsertLink('canonical', canonical)
  upsertLink('alternate', pageUrl(path, 'en'), 'en')
  upsertLink('alternate', pageUrl(path, 'de'), 'de')
  upsertLink('alternate', pageUrl(path, 'en'), 'x-default')

  setJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: ['en', 'de'],
      },
      {
        '@type': 'Person',
        name: SITE_NAME,
        jobTitle: 'Monitor Engineer',
        url: `${SITE_URL}/`,
        email: 'mailto:info@andyebert.com',
        sameAs: [
          'https://www.linkedin.com/in/andyebert',
          'https://instagram.com/andyebert',
        ],
      },
      {
        '@type': 'WebPage',
        name: fullTitle,
        description: summary,
        url: canonical,
        inLanguage: lang,
        isPartOf: `${SITE_URL}/`,
      },
    ],
  })
}
