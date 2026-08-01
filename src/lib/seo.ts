/**
 * SEO helpers — set document title and meta description per route.
 * Future: swap for react-helmet-async or framework head management.
 */

export interface SeoConfig {
  title: string
  description?: string
}

const SITE_NAME = 'Andy Ebert'

export function setSeo({ title, description }: SeoConfig) {
  document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

  if (description) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)

    let og = document.querySelector('meta[property="og:description"]')
    if (!og) {
      og = document.createElement('meta')
      og.setAttribute('property', 'og:description')
      document.head.appendChild(og)
    }
    og.setAttribute('content', description)
  }

  let ogTitle = document.querySelector('meta[property="og:title"]')
  if (!ogTitle) {
    ogTitle = document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    document.head.appendChild(ogTitle)
  }
  ogTitle.setAttribute('content', document.title)
}
