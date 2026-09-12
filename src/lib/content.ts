import type {
  ArtistIntro,
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
import siteDeData from '@/data/de/site.json'
import navDeData from '@/data/de/nav.json'
import servicesDeData from '@/data/de/services.json'
import downloadsDeData from '@/data/de/downloads.json'
import experienceDeCopy from '@/data/de/experience-copy.json'
import projectOverviewsDe from '@/data/de/project-overviews.json'
import projectPhrasesDe from '@/data/de/project-phrases.json'
import artistIntrosEn from '@/data/artist-intros.json'
import artistIntrosDe from '@/data/de/artist-intros.json'
import { loadStoredCredits } from '@/lib/admin'
import type { Language } from '@/i18n/types'
import { getUiCopy } from '@/i18n/ui'

export const site = siteData as SiteConfig
export const nav = navData as NavItem[]
export const siteDe = siteDeData as SiteConfig
export const navDe = navDeData as NavItem[]
export const servicesDe = servicesDeData as Service[]
export const downloadsDe = downloadsDeData as DownloadsData

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

export function getSite(lang: Language): SiteConfig {
  return lang === 'de' ? siteDe : site
}

export function getNav(lang: Language): NavItem[] {
  return lang === 'de' ? navDe : nav
}

export function getServices(lang: Language): Service[] {
  return lang === 'de' ? servicesDe : services
}

export function getDownloads(lang: Language): DownloadsData {
  return lang === 'de' ? downloadsDe : downloads
}

export function getExperience(lang: Language): ExperienceData {
  if (lang !== 'de') return experience
  const copy = experienceDeCopy
  return {
    ...experience,
    resumeSummary: copy.resumeSummary,
    award: copy.award,
    timeline: experience.timeline.map((entry, i) => ({
      ...entry,
      tour: copy.timeline[i]?.tour ?? entry.tour,
      description: copy.timeline[i]?.description ?? entry.description,
    })),
    skills: experience.skills.map((group, i) => ({
      title: copy.skills[i]?.title ?? group.title,
      items: copy.skills[i]?.items ?? group.items,
    })),
  }
}

export function localizeYearLabel(label: string, lang: Language): string {
  if (lang !== 'de') return label
  return label.replace(/Present/gi, getUiCopy('de').year.present)
}

export function localizeRegion(region: string, lang: Language): string {
  if (lang !== 'de') return region
  const t = getUiCopy('de')
  return region
    .split(' · ')
    .map((part) => {
      const key = part as keyof typeof t.regions
      return t.regions[key] ?? part.replace(/Worldwide/gi, t.regions.Worldwide)
    })
    .join(' · ')
}

export function localizeRole(role: string, lang: Language): string {
  if (lang !== 'de') return role
  const t = getUiCopy('de')
  const key = role as keyof typeof t.roles
  return t.roles[key] ?? role
}

export function localizeCategory(category: string, lang: Language): string {
  const t = getUiCopy(lang)
  if (category === 'All') return t.filters.all
  const key = category as keyof typeof t.filters
  return t.filters[key] ?? category
}

export function localizeProjectTitle(title: string, lang: Language): string {
  if (lang !== 'de') return title
  const t = getUiCopy('de')
  const key = title as keyof typeof t.titles
  return t.titles[key] ?? title
}

export function localizePressType(type: PressItem['type'], lang: Language): string {
  const t = getUiCopy(lang)
  return t.press.types[type] ?? type
}

const artistIntroByLang: Record<Language, Record<string, ArtistIntro>> = {
  en: artistIntrosEn as Record<string, ArtistIntro>,
  de: artistIntrosDe as Record<string, ArtistIntro>,
}

export function getArtistIntro(slug: string, lang: Language): ArtistIntro | undefined {
  const intro = artistIntroByLang[lang]?.[slug] ?? artistIntroByLang.en[slug]
  if (intro?.paragraphs?.length) return intro
  const project = getProjectBySlug(slug)
  if (!project?.overview) return undefined
  return { paragraphs: [project.overview], sources: [] }
}

const projectPhrases = projectPhrasesDe as Record<string, string>

function localizeProjectPhrase(text: string): string {
  return projectPhrases[text] ?? text
}

export function localizeProject(project: Project, lang: Language): Project {
  if (lang !== 'de') return project
  const overview =
    (projectOverviewsDe as Record<string, string>)[project.slug] ?? project.overview
  return {
    ...project,
    title: localizeProjectTitle(project.title, lang),
    role: localizeRole(project.role, lang),
    year: localizeYearLabel(project.year, lang),
    overview,
    responsibilities: project.responsibilities.map(localizeProjectPhrase),
    challenges: project.challenges.map(localizeProjectPhrase),
    technicalSetup: localizeProjectPhrase(project.technicalSetup),
    equipment: project.equipment.map(localizeProjectPhrase),
    technicalNotes: project.technicalNotes
      ? localizeProjectPhrase(project.technicalNotes)
      : project.technicalNotes,
  }
}

export function localizeGroupedCredit(
  credit: GroupedCredit,
  lang: Language,
): GroupedCredit {
  if (lang !== 'de') return credit
  return {
    ...credit,
    yearLabel: localizeYearLabel(credit.yearLabel, lang),
    region: localizeRegion(credit.region, lang),
    role: localizeRole(credit.role, lang),
  }
}

export type PressTypeFilter = 'all' | PressItem['type']

export function pressHref(item: PressItem): string | undefined {
  if (item.pdf) return item.pdf
  if (item.url && item.url !== '#') return item.url
  return undefined
}

export function pressAnchorProps(item: PressItem) {
  const href = pressHref(item)
  if (!href) return undefined
  return {
    href,
    target: '_blank' as const,
    rel: 'noreferrer',
    ...(item.pdf ? { type: 'application/pdf' as const } : {}),
  }
}

export function getPressItems(type: PressTypeFilter = 'all'): PressItem[] {
  const items = [...press].sort((a, b) => b.sortDate.localeCompare(a.sortDate))
  if (type === 'all') return items
  return items.filter((item) => item.type === type)
}

export function getPressForProject(slug: string): PressItem[] {
  return getPressItems().filter((item) => item.projectSlugs?.includes(slug))
}
export const projects = projectsData as Project[]
export const experience = experienceData as ExperienceData
export const gallery = galleryData as GalleryItem[]
export const downloads = downloadsData as DownloadsData

/** Scene / venue chips shown first on the Gallery page. */
export const GALLERY_SCENE_TAGS = [
  'Arena',
  'Backstage',
  'Monitor World',
  'Rehearsals',
  'Crew',
  'Equipment',
  'Console',
  'FOH',
  'Headshot',
  'Festivals',
  'Amphitheaters',
  'Tour',
  'Berlin',
  'Los Angeles',
] as const

export const GALLERY_YEAR_RE = /^\d{4}$/

export type GallerySort = 'order' | 'newest' | 'oldest' | 'tag'

const GALLERY_NON_ARTIST_TAGS = new Set<string>(['Portrait', ...GALLERY_SCENE_TAGS])

/** Misspelled labels retired from the admin tag list. */
const RETIRED_GALLERY_TAGS = new Set(['Quantum'])
const RENAMED_GALLERY_TAGS: Record<string, string> = {
  'Quantum World': 'Quannum World',
}

export function canonicalGalleryTag(tag: string): string | null {
  const value = tag.trim()
  if (!value || RETIRED_GALLERY_TAGS.has(value)) return null
  return RENAMED_GALLERY_TAGS[value] ?? value
}

export function migrateGalleryTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const next: string[] = []
  for (const tag of tags) {
    const value = canonicalGalleryTag(tag)
    if (!value || seen.has(value)) continue
    seen.add(value)
    next.push(value)
  }
  return next
}

export function migrateGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return items.map((item) => {
    const tags = migrateGalleryTags(item.tags)
    if (
      tags.length === item.tags.length &&
      tags.every((tag, index) => tag === item.tags[index])
    ) {
      return item
    }
    return { ...item, tags }
  })
}

export function sanitizeGalleryExtraTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  const seen = new Set<string>()
  const next: string[] = []
  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    const value = canonicalGalleryTag(tag)
    if (!value || GALLERY_YEAR_RE.test(value) || GALLERY_NON_ARTIST_TAGS.has(value)) {
      continue
    }
    if (seen.has(value)) continue
    seen.add(value)
    next.push(value)
  }
  return next.sort((a, b) => a.localeCompare(b))
}

function nonArtistTagSet(extraTags: readonly string[] = []) {
  if (extraTags.length === 0) return GALLERY_NON_ARTIST_TAGS
  return new Set<string>([...GALLERY_NON_ARTIST_TAGS, ...extraTags])
}

export function galleryCategoryFromTags(tags: string[]): string {
  return GALLERY_SCENE_TAGS.find((tag) => tags.includes(tag)) ?? tags[0] ?? 'Tour'
}

export function galleryCustomTags(
  tags: string[],
  extraTags: readonly string[] = [],
): string[] {
  const nonArtist = nonArtistTagSet(extraTags)
  return tags.filter((tag) => !nonArtist.has(tag) && !GALLERY_YEAR_RE.test(tag))
}

export function galleryWithSyncedYear(tags: string[], year?: number): string[] {
  const rest = tags.filter((tag) => !GALLERY_YEAR_RE.test(tag))
  if (year && year >= 1900 && year <= 2100) return [...rest, String(year)]
  return rest
}

export function getGalleryTeaser(
  limit = 6,
  items: GalleryItem[] = gallery,
): GalleryItem[] {
  const flagged = items.filter((item) => item.teaser)
  return (flagged.length ? flagged : items).slice(0, limit)
}

export function getGallerySceneTags(
  items: GalleryItem[] = gallery,
  extraTags: readonly string[] = [],
): string[] {
  const present = new Set(items.flatMap((item) => item.tags))
  const presets = GALLERY_SCENE_TAGS.filter((tag) => present.has(tag))
  const extras = extraTags.filter(
    (tag) => present.has(tag) && !GALLERY_NON_ARTIST_TAGS.has(tag),
  )
  return [...presets, ...extras]
}

export function getGalleryArtistTags(
  items: GalleryItem[] = gallery,
  extraTags: readonly string[] = [],
): string[] {
  const nonArtist = nonArtistTagSet(extraTags)
  const artists = new Set<string>()
  for (const item of items) {
    for (const tag of item.tags) {
      if (nonArtist.has(tag) || GALLERY_YEAR_RE.test(tag)) continue
      artists.add(tag)
    }
  }
  return Array.from(artists).sort((a, b) => a.localeCompare(b))
}

export function getGalleryYearTags(items: GalleryItem[] = gallery): string[] {
  const years = new Set<string>()
  for (const item of items) {
    for (const tag of item.tags) {
      if (GALLERY_YEAR_RE.test(tag)) years.add(tag)
    }
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a))
}

function normalizeArtistKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function projectArtistKeys(artist: string): string[] {
  const full = normalizeArtistKey(artist)
  const parts = artist
    .split(/\s*[·,/|&]\s*|\s+and\s+/i)
    .map((part) => normalizeArtistKey(part))
    .filter((part) => part.length > 1)
  return Array.from(new Set([full, ...parts].filter(Boolean)))
}

export function galleryItemMatchesArtist(
  item: GalleryItem,
  artist: string,
): boolean {
  const keys = new Set(projectArtistKeys(artist))
  if (keys.size === 0) return false
  return item.tags.some((tag) => keys.has(normalizeArtistKey(tag)))
}

export type ProjectGallerySource = {
  src: string
  alt?: string
  caption?: string
  id?: number
  focalX?: number
  focalY?: number
}

function projectGallerySourceFromItem(
  item: Pick<GalleryItem, 'id' | 'src' | 'alt' | 'caption' | 'focalX' | 'focalY'>,
): ProjectGallerySource {
  return {
    id: item.id,
    src: item.src,
    alt: item.alt,
    caption: item.caption || item.alt,
    focalX: item.focalX,
    focalY: item.focalY,
  }
}

/** Tagged gallery photos for an artist, then any extra URLs from the project file. */
export function mergeProjectGallerySources(
  projectGallery: string[],
  artist: string,
  items: GalleryItem[],
): ProjectGallerySource[] {
  const seen = new Set<string>()
  const out: ProjectGallerySource[] = []
  const bySrc = new Map(items.map((item) => [item.src, item]))

  for (const item of items) {
    if (!galleryItemMatchesArtist(item, artist) || seen.has(item.src)) continue
    seen.add(item.src)
    out.push(projectGallerySourceFromItem(item))
  }

  for (const src of projectGallery) {
    if (seen.has(src)) continue
    const match = bySrc.get(src)
    if (!match) continue
    seen.add(src)
    out.push(projectGallerySourceFromItem(match))
  }

  return out
}

/** 0-based index, or negative from the end (-1 last, -2 second to last). */
type ProjectGalleryPin = { id: number; at: number }

const PROJECT_GALLERY_PINS: Record<string, ProjectGalleryPin[]> = {
  'alanis-morissette': [
    { id: 31, at: 2 },
    { id: 27, at: -2 },
    { id: 37, at: -1 },
  ],
}

const PROJECT_GALLERY_SWAPS: Record<string, Array<[number, number]>> = {
  'neil-young': [[136, 139]],
  'maroon-5': [[123, 188]],
}

export function pinProjectGallerySources(
  sources: ProjectGallerySource[],
  slug: string,
): ProjectGallerySource[] {
  const pins = PROJECT_GALLERY_PINS[slug]
  let out = sources

  if (pins?.length) {
    const byId = new Map(
      sources
        .filter((item): item is ProjectGallerySource & { id: number } => item.id != null)
        .map((item) => [item.id, item]),
    )
    const pinnedIds = new Set(pins.map((pin) => pin.id))
    out = sources.filter((item) => item.id == null || !pinnedIds.has(item.id))

    for (const pin of pins.filter((item) => item.at >= 0).sort((a, b) => a.at - b.at)) {
      const item = byId.get(pin.id)
      if (!item) continue
      out.splice(Math.min(Math.max(0, pin.at), out.length), 0, item)
    }

    for (const pin of pins.filter((item) => item.at < 0).sort((a, b) => b.at - a.at)) {
      const item = byId.get(pin.id)
      if (!item) continue
      const index = Math.min(out.length, Math.max(0, out.length + pin.at + 1))
      out.splice(index, 0, item)
    }
  }

  const swaps = PROJECT_GALLERY_SWAPS[slug]
  if (swaps?.length) {
    out = [...out]
    for (const [a, b] of swaps) {
      const i = out.findIndex((item) => item.id === a)
      const j = out.findIndex((item) => item.id === b)
      if (i < 0 || j < 0) continue
      ;[out[i], out[j]] = [out[j], out[i]]
    }
  }

  return out
}

export function applyArtistGalleryOrder(
  sources: ProjectGallerySource[],
  orderIds: number[] | undefined | null,
): ProjectGallerySource[] {
  if (!orderIds?.length) return sources
  const byId = new Map<number, ProjectGallerySource>()
  for (const item of sources) {
    if (item.id == null || byId.has(item.id)) continue
    byId.set(item.id, item)
  }
  const seen = new Set<number>()
  const out: ProjectGallerySource[] = []
  for (const id of orderIds) {
    const item = byId.get(id)
    if (!item || seen.has(id)) continue
    seen.add(id)
    out.push(item)
  }
  for (const item of sources) {
    if (item.id != null && seen.has(item.id)) continue
    if (item.id != null) seen.add(item.id)
    out.push(item)
  }
  return out
}

/** Saved Blob IDs if present; otherwise today's merge + pin/swap layout. */
export function resolveProjectGallerySources(
  projectGallery: string[],
  artist: string,
  slug: string,
  items: GalleryItem[],
  orderIds?: number[] | null,
): ProjectGallerySource[] {
  const merged = mergeProjectGallerySources(projectGallery, artist, items)
  if (orderIds && orderIds.length > 0) {
    return applyArtistGalleryOrder(merged, orderIds)
  }
  return pinProjectGallerySources(merged, slug)
}

export function filterGallery(
  selected: string[],
  sort: GallerySort = 'order',
  source: GalleryItem[] = gallery,
): GalleryItem[] {
  const items =
    selected.length === 0
      ? [...source]
      : source.filter((item) => selected.every((tag) => item.tags.includes(tag)))

  // Admin list order (array position), not internal photo id.
  if (sort === 'order') return items

  items.sort((a, b) => {
    if (sort === 'newest') {
      return (b.year ?? 0) - (a.year ?? 0) || a.id - b.id
    }
    if (sort === 'oldest') {
      return (a.year ?? 0) - (b.year ?? 0) || a.id - b.id
    }
    const tagA = a.tags.find((tag) => !GALLERY_YEAR_RE.test(tag)) ?? a.tags[0] ?? ''
    const tagB = b.tags.find((tag) => !GALLERY_YEAR_RE.test(tag)) ?? b.tags[0] ?? ''
    return tagA.localeCompare(tagB) || a.alt.localeCompare(b.alt)
  })

  return items
}

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
  'R.E.M.',
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
  'Quannum World',
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
const CREDIT_ONLY_GALLERY_SRC =
  gallery.find((item) => item.id === 47)?.src ?? '/images/portfolio/console.jpg'

const CREDIT_ONLY_IMAGES: Record<string, string> = {
  'Rock am Ring Festival': '/images/projects/cards/rock-am-ring-festival.jpg',
  'Expo 2000': CREDIT_ONLY_GALLERY_SRC,
  'Countless artists': CREDIT_ONLY_GALLERY_SRC,
}

/**
 * Role-specific timeline photos when one artist has multiple credit cards
 * that would otherwise share the same project image.
 */
const CREDIT_ROLE_IMAGES: Record<string, string> = {
  'Adam Lambert::FOH Engineer': '/images/projects/cards/adam-lambert-2.jpg',
  'Momix::FOH Engineer': '/images/projects/cards/momix.jpg',
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
