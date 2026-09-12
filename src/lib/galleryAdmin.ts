import type { GalleryItem } from '@/types'
import galleryData from '@/data/gallery.json'
import { migrateGalleryItems, sanitizeGalleryExtraTags } from '@/lib/content'
import { clampGalleryFocal, hasCustomGalleryFocal } from '@/lib/galleryFocal'
import { blobToBase64 } from '@/lib/resizeImage'

export const GALLERY_STORAGE_KEY = 'ae-gallery-v2'
export const GALLERY_UPDATED_EVENT = 'ae-gallery-updated'
export const ARTIST_ORDER_UPDATED_EVENT = 'ae-artist-order-updated'

export type ArtistGalleryOrderMap = Record<string, number[]>

const ARTIST_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function sanitizeArtistOrder(raw: unknown): ArtistGalleryOrderMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: ArtistGalleryOrderMap = {}
  for (const [slug, ids] of Object.entries(raw as Record<string, unknown>)) {
    const key = slug.trim().toLowerCase()
    if (!ARTIST_SLUG_RE.test(key) || key.length > 80 || !Array.isArray(ids)) continue
    const seen = new Set<number>()
    const list: number[] = []
    for (const value of ids) {
      const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
      if (!Number.isInteger(n) || n < 1 || seen.has(n)) continue
      seen.add(n)
      list.push(n)
      if (list.length >= 400) break
    }
    if (list.length) out[key] = list
  }
  return out
}

export function bundledGallery(): GalleryItem[] {
  return migrateGalleryItems(structuredClone(galleryData as GalleryItem[]))
}

export function galleryOrderKey(items: GalleryItem[]): string {
  return items.map((item) => item.id).join(',')
}

export function nextGalleryId(items: GalleryItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function readStoredGalleryRecord(): {
  items?: GalleryItem[]
  extraTags?: unknown
} | null {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      items?: GalleryItem[]
      extraTags?: unknown
    }
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function persistGalleryLocal(items: GalleryItem[], extraTags?: string[]) {
  const stored = readStoredGalleryRecord()
  localStorage.setItem(
    GALLERY_STORAGE_KEY,
    JSON.stringify({
      items: migrateGalleryItems(items),
      extraTags: sanitizeGalleryExtraTags(
        extraTags ?? stored?.extraTags ?? [],
      ),
      updatedAt: Date.now(),
    }),
  )
  window.dispatchEvent(new Event(GALLERY_UPDATED_EVENT))
}

export function loadStoredGallery(): GalleryItem[] | null {
  const parsed = readStoredGalleryRecord()
  if (!Array.isArray(parsed?.items)) return null
  return migrateGalleryItems(parsed.items)
}

export function loadStoredExtraTags(): string[] {
  return sanitizeGalleryExtraTags(readStoredGalleryRecord()?.extraTags)
}

export function clearStoredGallery() {
  localStorage.removeItem(GALLERY_STORAGE_KEY)
  window.dispatchEvent(new Event(GALLERY_UPDATED_EVENT))
}

export function galleryForJson(items: GalleryItem[]): GalleryItem[] {
  return migrateGalleryItems(items).map((item) => {
    const next: GalleryItem = {
      id: item.id,
      src: item.src.startsWith('/images/') ? item.src.split('?')[0] : item.src,
      alt: item.alt,
      category: item.category,
      tags: [...item.tags],
      width: item.width,
      height: item.height,
    }
    if (typeof item.year === 'number') next.year = item.year
    const caption = item.caption?.trim() || item.alt.trim()
    if (caption) next.caption = caption
    if (item.teaser === true) next.teaser = true
    if (hasCustomGalleryFocal(item.focalX, item.focalY)) {
      next.focalX = clampGalleryFocal(item.focalX)
      next.focalY = clampGalleryFocal(item.focalY)
    }
    return next
  })
}

export async function fetchRemoteGalleryPayload(): Promise<{
  items: GalleryItem[] | null
  artistOrder: ArtistGalleryOrderMap
} | null> {
  try {
    const res = await fetch(`/api/gallery?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      items?: GalleryItem[] | null
      artistOrder?: unknown
    }
    const items =
      Array.isArray(data.items) && data.items.length > 0
        ? migrateGalleryItems(data.items)
        : null
    return {
      items,
      artistOrder: sanitizeArtistOrder(data.artistOrder),
    }
  } catch {
    return null
  }
}

export async function fetchRemoteGallery(): Promise<GalleryItem[] | null> {
  const payload = await fetchRemoteGalleryPayload()
  return payload?.items ?? null
}

export async function saveArtistOrderRemote(
  slug: string,
  ids: number[],
  password: string,
): Promise<{ ok: boolean; blob?: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/gallery', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ slug, ids }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, message: text || res.statusText }
    }
    window.dispatchEvent(new Event(ARTIST_ORDER_UPDATED_EVENT))
    window.dispatchEvent(new Event(GALLERY_UPDATED_EVENT))
    const data = (await res.json()) as { ok?: boolean; blob?: boolean }
    return { ok: true, blob: Boolean(data.blob) }
  } catch {
    return { ok: false, message: 'Could not reach save API' }
  }
}

export async function saveGalleryRemote(
  items: GalleryItem[],
  password: string,
): Promise<{ ok: boolean; file?: boolean; blob?: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/gallery', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ items: galleryForJson(items) }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, message: text || res.statusText }
    }
    const data = (await res.json()) as {
      ok?: boolean
      file?: boolean
      blob?: boolean
    }
    return { ok: true, file: Boolean(data.file), blob: Boolean(data.blob) }
  } catch {
    return { ok: false, message: 'Could not reach save API' }
  }
}

export async function uploadGalleryImage(
  payload: {
    blob: Blob
    width: number
    height: number
    filename: string
    id?: number
  },
  password: string,
): Promise<{ ok: boolean; src?: string; width?: number; height?: number; message?: string }> {
  try {
    const data = await blobToBase64(payload.blob)
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({
        id: payload.id,
        filename: payload.filename,
        contentType: 'image/jpeg',
        data,
        width: payload.width,
        height: payload.height,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, message: text || res.statusText }
    }
    const body = (await res.json()) as {
      src?: string
      width?: number
      height?: number
    }
    if (!body.src) return { ok: false, message: 'Upload did not return a URL' }
    return {
      ok: true,
      src: body.src,
      width: body.width ?? payload.width,
      height: body.height ?? payload.height,
    }
  } catch {
    return { ok: false, message: 'Could not reach upload API' }
  }
}

export function downloadGalleryJson(items: GalleryItem[]) {
  const blob = new Blob([`${JSON.stringify(galleryForJson(items), null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gallery.json'
  a.click()
  URL.revokeObjectURL(url)
}
