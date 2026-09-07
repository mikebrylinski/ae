import type { GalleryItem } from '@/types'
import galleryData from '@/data/gallery.json'
import { blobToBase64 } from '@/lib/resizeImage'

export const GALLERY_STORAGE_KEY = 'ae-gallery-v2'
export const GALLERY_UPDATED_EVENT = 'ae-gallery-updated'

export function bundledGallery(): GalleryItem[] {
  return structuredClone(galleryData as GalleryItem[])
}

export function nextGalleryId(items: GalleryItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export function persistGalleryLocal(items: GalleryItem[]) {
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify({ items }))
  window.dispatchEvent(new Event(GALLERY_UPDATED_EVENT))
}

export function loadStoredGallery(): GalleryItem[] | null {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { items?: GalleryItem[] }
    if (!Array.isArray(parsed.items)) return null
    return parsed.items
  } catch {
    return null
  }
}

export function clearStoredGallery() {
  localStorage.removeItem(GALLERY_STORAGE_KEY)
  window.dispatchEvent(new Event(GALLERY_UPDATED_EVENT))
}

export function galleryForJson(items: GalleryItem[]): GalleryItem[] {
  return items.map((item) => {
    const next: GalleryItem = {
      id: item.id,
      src: item.src,
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
    return next
  })
}

export async function fetchRemoteGallery(): Promise<GalleryItem[] | null> {
  try {
    const res = await fetch('/api/gallery', { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { items?: GalleryItem[] | null }
    if (!Array.isArray(data.items)) return null
    return data.items
  } catch {
    return null
  }
}

export async function saveGalleryRemote(
  items: GalleryItem[],
  password: string,
): Promise<{ ok: boolean; file?: boolean; message?: string }> {
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
    const data = (await res.json()) as { ok?: boolean; file?: boolean }
    return { ok: true, file: Boolean(data.file) }
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
