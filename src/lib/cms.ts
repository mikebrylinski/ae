/**
 * Content adapters.
 * Gallery is edited at /admin (password + Vercel Blob in production).
 * Contact form: POST /api/contact (Resend → CONTACT_TO_EMAIL)
 *
 * TODO: Sanity / Contentful for the rest of the site
 * TODO: MDX blog
 * TODO: Dark/light mode
 * TODO: Project search
 * TODO: Analytics
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
