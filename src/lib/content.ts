import type {
  CreditEntry,
  DownloadsData,
  ExperienceData,
  GalleryItem,
  GroupedCredit,
  NavItem,
  PressItem,
  Project,
  ProjectCategory,
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

/**
 * Artist × venue chart columns (filter chips / card badges), left → right:
 * AMPHITH. · ARENA · CLUBS · CORPORATE · FESTIVALS · STADIUMS · TV · THEATRES · TOURS
 */
export const CHART_VENUE_ORDER = [
  'Amphitheaters',
  'Arena',
  'Clubs',
  'Corporate',
  'Festivals',
  'Stadiums',
  'TV',
  'Theatres',
  'Tours',
] as const satisfies readonly ProjectCategory[]

export const SPOTLIGHT_FILTERS = ['All', ...CHART_VENUE_ORDER] as const

/** Venue chips for a project in chart column order. */
export function getChartVenueChips(
  categories: Project['category'],
): ProjectCategory[] {
  const set = new Set(categories)
  return CHART_VENUE_ORDER.filter((venue) => set.has(venue))
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
  'Travis Scott',
  'Local Natives',
  'Black Rebel Motorcycle Club',
  'Alice In Chains',
  'Enrique Iglesias',
  'Sebastian Bach',
  'Quantum World',
  'Al Bano Carrisi',
  'Countless artists',
])

export type CreditRoleFilter = 'all' | 'monitors' | 'foh'

type YearSpan = { start: number; end: number; open?: boolean; literal?: string }

function parseYearSpan(year: string): YearSpan {
  const trimmed = year.trim()
  const now = new Date().getFullYear()

  if (/^(current|present)$/i.test(trimmed)) {
    return { start: now, end: now, open: true }
  }

  const openRange = trimmed.match(/^(\d{4})\s*[–-]\s*(?:current|present)$/i)
  if (openRange) {
    return { start: Number.parseInt(openRange[1], 10), end: now, open: true }
  }

  const match = trimmed.match(/^(\d{4})(?:\s*[–-]\s*(\d{4}))?$/)
  if (!match) {
    const fallback = Number.parseInt(trimmed, 10)
    if (Number.isNaN(fallback)) {
      return { start: 0, end: 0, literal: trimmed || '—' }
    }
    return { start: fallback, end: fallback }
  }
  const start = Number.parseInt(match[1], 10)
  const end = match[2] ? Number.parseInt(match[2], 10) : start
  return { start, end }
}

function formatYearRanges(spans: YearSpan[]): string {
  if (spans.length === 1 && spans[0].literal) return spans[0].literal

  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const merged: YearSpan[] = []

  for (const span of sorted) {
    const prev = merged[merged.length - 1]
    if (prev && !prev.literal && !span.literal && span.start <= prev.end + 1) {
      prev.end = Math.max(prev.end, span.end)
      prev.open = Boolean(prev.open || span.open)
    } else {
      merged.push({ ...span })
    }
  }

  return merged
    .map(({ start, end, open, literal }) => {
      if (literal) return literal
      if (open) return start === end ? 'Present' : `${start}–Present`
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

/** Credit-only artists without a project page — local Wikipedia / site photos. */
const CREDIT_ONLY_IMAGES: Record<string, string> = {
  'Rock am Ring Festival': '/images/projects/cards/rock-am-ring-festival.jpg',
  'Expo 2000': '/images/portfolio/console.jpg',
  'Countless artists': '/images/portfolio/console.jpg',
}

/**
 * Role-specific timeline photos when one artist has multiple credit cards
 * that would otherwise share the same project image.
 */
const CREDIT_ROLE_IMAGES: Record<string, string> = {
  'Adam Lambert::FOH Engineer': '/images/projects/cards/adam-lambert-2.jpg',
}

function findProjectForCreditArtist(artist: string): Project | undefined {
  const exact = projects.find((p) => p.artist === artist)
  if (exact) return exact

  const lower = artist.toLowerCase()
  return projects.find((p) => {
    const name = p.artist.toLowerCase()
    return lower.includes(name) || name.includes(lower)
  })
}

function enrichGroupedCredit(credit: GroupedCredit): GroupedCredit {
  const project = findProjectForCreditArtist(credit.artist)
  const roleKey = `${credit.artist}::${credit.role}`
  const cardImage =
    CREDIT_ROLE_IMAGES[roleKey] ||
    project?.cardImage ||
    CREDIT_ONLY_IMAGES[credit.artist] ||
    undefined
  return {
    ...credit,
    cardImage,
    projectSlug: project?.slug,
  }
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
    const endYear = Math.max(...spans.map((s) => s.end))

    if (entries[0].artist === 'Alanis Morissette') {
      grouped.push(
        enrichGroupedCredit({
          yearLabel: '2012–Present',
          artist: entries[0].artist,
          region: 'Worldwide',
          role: entries[0].role,
          endYear,
        }),
      )
      continue
    }

    grouped.push(
      enrichGroupedCredit({
        yearLabel: formatYearRanges(spans),
        artist: entries[0].artist,
        region: mergeRegions(entries.map((e) => e.region)),
        role: entries[0].role,
        endYear,
      }),
    )
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
    credits = credits.filter((c) => /monitor/i.test(c.role))
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
