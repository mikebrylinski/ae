import type { PressTypeFilter } from '@/lib/content'
import { persistListBackSource } from '@/lib/creditsView'
import { parseCreditsPage } from '@/lib/creditsView'

export const PRESS_PAGE_PARAM = 'pressPage'
export const PRESS_TYPE_PARAM = 'pressType'
export const PRESS_SECTION_HASH = 'press-timeline'

const STORAGE_KEY = 'ae:press-timeline-view'

export type PressView = {
  page: number
  type: PressTypeFilter
}

export type PressLinkState = PressView & { from: 'press' }

const DEFAULT_VIEW: PressView = { page: 1, type: 'all' }

export function parsePressType(
  raw: string | null | undefined,
): PressTypeFilter {
  if (raw === 'Interview' || raw === 'Article' || raw === 'Review' || raw === 'all') {
    return raw
  }
  return 'all'
}

export function readStoredPressView(): PressView {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VIEW
    const parsed = JSON.parse(raw) as Partial<PressView>
    return {
      page: parseCreditsPage(String(parsed.page ?? 1)),
      type: parsePressType(parsed.type),
    }
  } catch {
    return DEFAULT_VIEW
  }
}

export function persistPressView(view: PressView) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(view))
    persistListBackSource('press')
  } catch {
    /* ignore quota / private mode */
  }
}

export function pressViewSearch(view: PressView): string {
  const params = new URLSearchParams()
  if (view.type !== 'all') params.set(PRESS_TYPE_PARAM, view.type)
  if (view.page > 1) params.set(PRESS_PAGE_PARAM, String(view.page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function mediaPressLocation(view: PressView = readStoredPressView()) {
  return {
    pathname: '/media',
    search: pressViewSearch(view),
    hash: `#${PRESS_SECTION_HASH}`,
  }
}
