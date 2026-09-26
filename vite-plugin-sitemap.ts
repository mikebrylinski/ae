import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const SITE_URL = 'https://andyebert.com'

const STATIC_PAGES: { path: string; priority: string }[] = [
  { path: '/', priority: '1.0' },
  { path: '/portfolio', priority: '0.9' },
  { path: '/about', priority: '0.8' },
  { path: '/contact', priority: '0.8' },
  { path: '/media', priority: '0.7' },
  { path: '/gallery', priority: '0.7' },
  { path: '/experience', priority: '0.6' },
  { path: '/downloads', priority: '0.5' },
]

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pageLoc(pathname: string, lang: 'en' | 'de') {
  const url = `${SITE_URL}${pathname}`
  return lang === 'de' ? `${url}?lang=de` : url
}

export function buildSitemap(rootDir: string) {
  const projects = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'src/data/projects.json'), 'utf8'),
  ) as { slug: string }[]

  const pages = [
    ...STATIC_PAGES,
    ...projects.map((project) => ({
      path: `/portfolio/${project.slug}`,
      priority: '0.6',
    })),
  ]

  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = pages.flatMap(({ path: pathname, priority }) =>
    (['en', 'de'] as const).map((lang) => ({ pathname, lang, priority })),
  )

  const body = urls
    .map(({ pathname, lang, priority }) => {
      const alternates = (['en', 'de'] as const)
        .map(
          (code) =>
            `    <xhtml:link rel="alternate" hreflang="${code}" href="${escapeXml(pageLoc(pathname, code))}" />`,
        )
        .concat(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(pageLoc(pathname, 'en'))}" />`,
        )
        .join('\n')

      return `  <url>
    <loc>${escapeXml(pageLoc(pathname, lang))}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
${alternates}
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`
}

export function sitemapPlugin(rootDir: string): Plugin {
  return {
    name: 'sitemap',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/sitemap.xml') {
          next()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml; charset=utf-8')
        res.end(buildSitemap(rootDir))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemap(rootDir),
      })
    },
  }
}
