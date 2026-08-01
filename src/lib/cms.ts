/**
 * Future CMS integration hooks.
 * Swap JSON imports in lib/content.ts with these adapters when ready.
 *
 * TODO: Sanity
 * TODO: Contentful
 * TODO: MDX blog
 * TODO: Dark/light mode
 * TODO: Multiple languages (i18n)
 * TODO: Project search
 * TODO: Analytics
 * TODO: Contact API
 * TODO: Image CDN / optimization
 */

export interface CmsClient {
  getProjects: () => Promise<unknown[]>
  getProjectBySlug: (slug: string) => Promise<unknown | null>
  getExperience: () => Promise<unknown>
  getGallery: () => Promise<unknown[]>
  getPress: () => Promise<unknown[]>
  getTestimonials: () => Promise<unknown[]>
  getServices: () => Promise<unknown[]>
}

/** Placeholder — returns null until a CMS is wired. */
export const cmsClient: CmsClient | null = null
