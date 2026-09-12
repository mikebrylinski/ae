import { useEffect, useState } from 'react'
import type { GalleryItem } from '@/types'
import {
  ARTIST_ORDER_UPDATED_EVENT,
  bundledGallery,
  fetchRemoteGalleryPayload,
  GALLERY_UPDATED_EVENT,
  type ArtistGalleryOrderMap,
} from '@/lib/galleryAdmin'

export function useLiveGalleryState() {
  const [items, setItems] = useState<GalleryItem[] | null>(null)
  const [artistOrder, setArtistOrder] = useState<ArtistGalleryOrderMap>({})

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const remote = await fetchRemoteGalleryPayload()
      if (cancelled) return
      // Wait for Blob so we do not paint the old bundled order first.
      setItems(remote?.items && remote.items.length > 0 ? remote.items : bundledGallery())
      setArtistOrder(remote?.artistOrder ?? {})
    }

    void hydrate()
    window.addEventListener(GALLERY_UPDATED_EVENT, hydrate)
    window.addEventListener(ARTIST_ORDER_UPDATED_EVENT, hydrate)
    return () => {
      cancelled = true
      window.removeEventListener(GALLERY_UPDATED_EVENT, hydrate)
      window.removeEventListener(ARTIST_ORDER_UPDATED_EVENT, hydrate)
    }
  }, [])

  return { items: items ?? [], artistOrder, ready: items !== null }
}

export function useLiveGallery(): GalleryItem[] {
  return useLiveGalleryState().items
}
