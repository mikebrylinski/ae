import type {
  CreditEntry,
  DownloadsData,
  ExperienceData,
  GalleryItem,
  GroupedCredit,
  NavItem,
  PressItem,
  Project,
  Service,
  SiteConfig,
  Testimonial,
} from '@/types'

import siteData from '@/data/site.json'
import navData from '@/data/nav.json'
import servicesData from '@/data/services.json'
import testimonialsData from '@/data/testimonials.json'
import pressData from '@/data/press.json'
import projectsData from '@/data/projects.json'
import experienceData from '@/data/experience.json'
import galleryData from '@/data/gallery.json'
import downloadsData from '@/data/downloads.json'
import { loadStoredCredits } from '@/lib/admin'

export const site = siteData as SiteConfig
export const nav = navData as NavItem[]

/** Flat list for footer / simple menus: parents then unique children. */
export function flattenNav(items: NavItem[] = nav): NavItem[] {
  const result: NavItem[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (!seen.has(item.href)) {
      result.push({ label: item.label, href: item.href })
      seen.add(item.href)
    }
    for (const child of item.children ?? []) {
      if (!seen.has(child.href)) {
        result.push({ label: child.label, href: child.href })
        seen.add(child.href)
      }
    }
  }

  return result
}

export const services = servicesData as Service[]
export const testimonials = testimonialsData as Testimonial[]
export const press = pressData as PressItem[]
export const projects = projectsData as Project[]
export const experience = experienceData as ExperienceData
export const gallery = galleryData as GalleryItem[]
export const downloads = downloadsData as DownloadsData

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured)
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getProjectsByCategory(category: string): Project[] {
  if (category === 'All') return projects
  return projects.filter((p) => p.category.includes(category as Project['category'][number]))
}

export function getAllCategories(): string[] {
  const set = new Set<string>()
  projects.forEach((p) => p.category.forEach((c) => set.add(c)))
  return ['All', ...Array.from(set).sort()]
}

export function getRelatedProjects(slug: string, limit = 3): Project[] {
  const current = getProjectBySlug(slug)
  if (!current) return projects.filter((p) => p.slug !== slug).slice(0, limit)
  return projects
    .filter(
      (p) =>
        p.slug !== slug && p.category.some((c) => current.category.includes(c)),
    )
    .slice(0, limit)
}

export function getCredits(): CreditEntry[] {
  const stored = typeof window !== 'undefined' ? loadStoredCredits() : null
  return stored ?? experience.credits ?? []
}

export function isCreditFeatured(credit: CreditEntry): boolean {
  if (typeof credit.featured === 'boolean') return credit.featured
  return PORTFOLIO_HIGHLIGHT_ARTISTS.has(credit.artist)
}

/**
 * Major arena / stadium / TV / career-defining credits for the Portfolio timeline.
 * Full `credits` stay available via getCredits(); Experience uses the separate `timeline`.
 */
const PORTFOLIO_HIGHLIGHT_ARTISTS = new Set([
  'Alanis Morissette',
  'The Weeknd',
  'Adam Lambert',
  'Carrie Underwood',
  'Stone Temple Pilots',
  'Neil Young',
  'Velvet Revolver',
  'Shakira',
  'Scott Weiland',
  'Maroon 5',
  "Guns N' Roses",
  'Mariah Carey',
  'Red Hot Chili Peppers',
  'Foo Fighters',
  'Usher',
  'Dream Theater',
  'REM',
  'Puddle Of Mudd',
  'Zwan',
  'Harlem Gospel Singers',
  'Modern Talking',
  'Glenn Hughes',
  'Michael Schenker Group',
  'Tarkan',
  'Rock am Ring Festival',
  'Expo 2000',
  'Golden Gospel Singers',
  'Momix',
  'Operator',
  'Ute Lemper and Tapiola Orchester',
])

export type CreditRoleFilter = 'all' | 'monitors' | 'foh'

function parseYearSpan(year: string): { start: number; end: number; open?: boolean } {
  const trimmed = year.trim()
  const now = new Date().getFullYear()

  if (/^current$/i.test(trimmed)) {
    return { start: now, end: now, open: true }
  }

  const openRange = trimmed.match(/^(\d{4})\s*[–-]\s*current$/i)
  if (openRange) {
    return { start: Number.parseInt(openRange[1], 10), end: now, open: true }
  }

  const match = trimmed.match(/^(\d{4})(?:\s*[–-]\s*(\d{4}))?$/)
  if (!match) {
    const fallback = Number.parseInt(trimmed, 10)
    return { start: fallback, end: fallback }
  }
  const start = Number.parseInt(match[1], 10)
  const end = match[2] ? Number.parseInt(match[2], 10) : start
  return { start, end }
}

function formatYearRanges(spans: { start: number; end: number; open?: boolean }[]): string {
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number; open?: boolean }[] = []

  for (const span of sorted) {
    const prev = merged[merged.length - 1]
    if (prev && span.start <= prev.end + 1) {
      prev.end = Math.max(prev.end, span.end)
      prev.open = Boolean(prev.open || span.open)
    } else {
      merged.push({ ...span })
    }
  }

  return merged
    .map(({ start, end, open }) => {
      if (open) return start === end ? 'Current' : `${start}–current`
      return start === end ? `${start}` : `${start}–${end}`
    })
    .join(', ')
}

function mergeRegions(regions: string[]): string {
  const unique = Array.from(new Set(regions.map((r) => r.trim()).filter(Boolean)))
  if (unique.some((r) => /worldwide/i.test(r))) {
    const rest = unique.filter((r) => !/worldwide/i.test(r))
    return rest.length ? `Worldwide · ${rest.join(' · ')}` : 'Worldwide'
  }
  return unique.join(' · ')
}

/** Collapse consecutive years for the same artist + role into range labels. */
export function collapseCredits(credits: CreditEntry[]): GroupedCredit[] {
  const byKey = new Map<string, CreditEntry[]>()

  for (const credit of credits) {
    const key = `${credit.artist}::${credit.role}`
    const list = byKey.get(key)
    if (list) list.push(credit)
    else byKey.set(key, [credit])
  }

  const grouped: GroupedCredit[] = []

  for (const entries of byKey.values()) {
    const spans = entries.map((e) => parseYearSpan(e.year))
    const yearLabel = formatYearRanges(spans)
    const endYear = Math.max(...spans.map((s) => s.end))
    grouped.push({
      yearLabel,
      artist: entries[0].artist,
      region: mergeRegions(entries.map((e) => e.region)),
      role: entries[0].role,
      endYear,
    })
  }

  return grouped.sort((a, b) => {
    if (b.endYear !== a.endYear) return b.endYear - a.endYear
    return a.artist.localeCompare(b.artist)
  })
}

/** Curated Portfolio credits: highlights only, consecutive years collapsed. */
export function getPortfolioCredits(
  role: CreditRoleFilter = 'all',
): GroupedCredit[] {
  let credits = getCredits().filter(isCreditFeatured)

  if (role === 'monitors') {
    credits = credits.filter((c) => c.role === 'Monitor Engineer')
  } else if (role === 'foh') {
    credits = credits.filter((c) => c.role === 'FOH Engineer')
  }

  return collapseCredits(credits)
}

/** Credits grouped by year label, newest first (source order preserved within each year). */
export function getCreditsByYear(): { year: string; credits: CreditEntry[] }[] {
  const map = new Map<string, CreditEntry[]>()
  for (const credit of getCredits()) {
    const list = map.get(credit.year)
    if (list) list.push(credit)
    else map.set(credit.year, [credit])
  }
  return Array.from(map.entries()).map(([year, credits]) => ({ year, credits }))
}
