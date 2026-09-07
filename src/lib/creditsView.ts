import type { CreditRoleFilter } from '@/lib/content'

export const CREDITS_PAGE_PARAM = 'creditsPage'
export const CREDITS_ROLE_PARAM = 'creditsRole'
export const CAREER_CREDITS_HASH = 'career-credits'

const STORAGE_KEY = 'ae:credits-timeline-view'

export const LIST_BACK_SOURCE_KEY = 'ae:list-back-source'
export type ListBackSource = 'credits' | 'press'

export function persistListBackSource(source: ListBackSource) {
  try {
    sessionStorage.setItem(LIST_BACK_SOURCE_KEY, source)
  } catch {
    /* ignore quota / private mode */
  }
}

export function readListBackSource(): ListBackSource | null {
  try {
    const value = sessionStorage.getItem(LIST_BACK_SOURCE_KEY)
    return value === 'credits' || value === 'press' ? value : null
  } catch {
    return null
  }
}

export type CreditsView = {
  page: number
  role: CreditRoleFilter
}

export type CreditsLinkState = CreditsView & { from: 'credits' }

const DEFAULT_VIEW: CreditsView = { page: 1, role: 'all' }

export function parseCreditsPage(raw: string | null | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export function parseCreditsRole(
  raw: string | null | undefined,
): CreditRoleFilter {
  if (raw === 'monitors' || raw === 'foh' || raw === 'all') return raw
  return 'all'
}

export function readStoredCreditsView(): CreditsView {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VIEW
    const parsed = JSON.parse(raw) as Partial<CreditsView>
    return {
      page: parseCreditsPage(String(parsed.page ?? 1)),
      role: parseCreditsRole(parsed.role),
    }
  } catch {
    return DEFAULT_VIEW
  }
}

export function persistCreditsView(view: CreditsView) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(view))
    persistListBackSource('credits')
  } catch {
    /* ignore quota / private mode */
  }
}

export function creditsViewSearch(view: CreditsView): string {
  const params = new URLSearchParams()
  if (view.role !== 'all') params.set(CREDITS_ROLE_PARAM, view.role)
  if (view.page > 1) params.set(CREDITS_PAGE_PARAM, String(view.page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function portfolioCreditsLocation(view: CreditsView = readStoredCreditsView()) {
  return {
    pathname: '/portfolio',
    search: creditsViewSearch(view),
    hash: `#${CAREER_CREDITS_HASH}`,
  }
}
