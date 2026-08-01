export type ProjectCategory =
  | 'Arena'
  | 'Broadcast'
  | 'Tours'
  | 'Television'
  | 'Festivals'
  | 'Musical Direction'

export interface Project {
  slug: string
  title: string
  artist: string
  year: string
  role: string
  category: ProjectCategory[]
  featured: boolean
  heroImage: string
  thumbnail: string
  /** Artist logo mark for project cards (prefer over photo thumbs when set). */
  logo?: string
  overview: string
  responsibilities: string[]
  technicalSetup: string
  equipment: string[]
  challenges: string[]
  gallery: string[]
  videos: { title: string; url: string; thumbnail?: string }[]
  technicalNotes?: string
}

export interface TimelineEntry {
  year: string
  tour: string
  artist: string
  description: string
  photo: string
}

/** Year-level credit from andyebert.com references (monitor / FOH). */
export interface CreditEntry {
  year: string
  artist: string
  region: string
  role: 'Monitor Engineer' | 'FOH Engineer' | string
}

/** Artist credit with consecutive years collapsed into ranges for Portfolio. */
export interface GroupedCredit {
  /** Display label, e.g. "2015–2019" or "2012, 2015–2016, 2019–2024" */
  yearLabel: string
  artist: string
  region: string
  role: CreditEntry['role']
  /** Latest year in the span — used for sorting */
  endYear: number
}

export interface SkillGroup {
  title: string
  items: string[]
}

export interface ExperienceData {
  timeline: TimelineEntry[]
  /** Detailed year-by-year credits from referenceseng.html */
  credits: CreditEntry[]
  resumeSummary: string
  award?: string
  skills: SkillGroup[]
  resumePdf: string
}

export interface GalleryItem {
  id: string
  src: string
  alt: string
  category: 'Arena' | 'Backstage' | 'Monitor World' | 'Rehearsals' | 'Crew' | 'Equipment'
  width: number
  height: number
}

export interface PressItem {
  id: string
  title: string
  type: 'Interview' | 'Article' | 'Video' | 'Review' | 'Podcast'
  publication: string
  date: string
  excerpt: string
  /** External article URL when available; empty/omitted means no outbound link. */
  url?: string
}

export interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
  company?: string
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
}

export interface NavItem {
  label: string
  href: string
}

export interface SiteConfig {
  name: string
  tagline: string
  email: string
  location: string
  linkedin: string
  social: { label: string; href: string }[]
  hero: {
    headline: string
    headlineAccent?: string
    subheadline: string[]
    body?: string
    ctaPrimary: { label: string; href: string }
    ctaSecondary: { label: string; href: string }
    backgroundImage: string
  }
  stats: { value: number; suffix?: string; label: string; icon?: string }[]
  cta: {
    title: string
    subtitle: string
    button: { label: string; href: string }
    /** Portrait / console shot for the CTA panel */
    image?: string
    imageAlt?: string
  }
  about: {
    portrait: string
    /** Prominent pullquote from andyebert.com biography */
    quote: string
    quoteAttribution?: string
    story: string[]
    philosophy: string
    travel: string
    behindTheScenes: string
    funFacts: string[]
  }
  media: {
    biography: string
    headshots: string[]
    logos: string[]
    downloads: { label: string; href: string; type: string }[]
  }
  contactPhoto: string
}
