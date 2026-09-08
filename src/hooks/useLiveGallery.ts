import { useEffect, useState } from 'react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGallery,
} from '@/lib/galleryAdmin'

export function useLiveGallery(): GalleryItem[] {
  const [items, setItems] = useState<GalleryItem[]>(() => bundledGallery())

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const remote = await fetchRemoteGallery()
      if (cancelled) return
      // Live gallery always follows the published Blob list, never browser
      // leftovers from /admin. Fall back to the bundled JSON only if Blob is empty.
      if (remote && remote.length > 0) setItems(remote)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  return items
}
