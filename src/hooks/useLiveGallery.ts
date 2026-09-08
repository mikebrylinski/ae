import { useEffect, useState } from 'react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGallery,
  GALLERY_UPDATED_EVENT,
} from '@/lib/galleryAdmin'

export function useLiveGalleryState() {
  const [items, setItems] = useState<GalleryItem[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const remote = await fetchRemoteGallery()
      if (cancelled) return
      // Wait for Blob so we do not paint the old bundled order first.
      setItems(remote && remote.length > 0 ? remote : bundledGallery())
    }

    void hydrate()
    window.addEventListener(GALLERY_UPDATED_EVENT, hydrate)
    return () => {
      cancelled = true
      window.removeEventListener(GALLERY_UPDATED_EVENT, hydrate)
    }
  }, [])

  return { items: items ?? [], ready: items !== null }
}

export function useLiveGallery(): GalleryItem[] {
  return useLiveGalleryState().items
}
