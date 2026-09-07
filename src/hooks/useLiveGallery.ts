import { useEffect, useState } from 'react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGallery,
  GALLERY_STORAGE_KEY,
  GALLERY_UPDATED_EVENT,
  loadStoredGallery,
} from '@/lib/galleryAdmin'

export function useLiveGallery(): GalleryItem[] {
  const [items, setItems] = useState<GalleryItem[]>(
    () => loadStoredGallery() ?? bundledGallery(),
  )

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const remote = await fetchRemoteGallery()
      if (cancelled) return
      const stored = loadStoredGallery()
      if (stored) {
        setItems(stored)
        return
      }
      if (remote) setItems(remote)
    }

    void hydrate()

    function applyStored() {
      const stored = loadStoredGallery()
      if (stored) setItems(stored)
    }

    function onStorage(event: StorageEvent) {
      if (event.key === GALLERY_STORAGE_KEY) applyStored()
    }

    window.addEventListener(GALLERY_UPDATED_EVENT, applyStored)
    window.addEventListener('storage', onStorage)
    return () => {
      cancelled = true
      window.removeEventListener(GALLERY_UPDATED_EVENT, applyStored)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return items
}
