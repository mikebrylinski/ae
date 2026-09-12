import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowDown, ArrowUp, Check, ChevronsDown, ChevronsUp, GripVertical, ImagePlus, Plus, Replace, Save, Trash2, X } from 'lucide-react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGallery,
  loadStoredGallery,
  loadStoredExtraTags,
  persistGalleryLocal,
  saveGalleryRemote,
  nextGalleryId,
  uploadGalleryImage,
} from '@/lib/galleryAdmin'
import { getAdminPassword, getSessionPassword } from '@/lib/admin'
import {
  GALLERY_SCENE_TAGS,
  GALLERY_YEAR_RE,
  galleryCategoryFromTags,
  galleryCustomTags,
  galleryWithSyncedYear,
  getGalleryArtistTags,
  sanitizeGalleryExtraTags,
} from '@/lib/content'
import { resizeImageFile } from '@/lib/resizeImage'
import {
  GALLERY_TILE_ASPECT_CLASS,
  clampGalleryFocal,
  galleryTilePositionStyle,
} from '@/lib/galleryFocal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GalleryPager, GALLERY_PAGE_SIZE } from '@/components/ui/GalleryPager'
import { cn } from '@/lib/utils'

const PAGE_SIZE = GALLERY_PAGE_SIZE

function galleryGridCols() {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1280px)').matches) return 4
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 640px)').matches) return 2
  return 1
}

function srcForReplacePreview(src: string) {
  if (!src.startsWith('/images/')) return src
  return `${src.split('?')[0]}?v=${Date.now()}`
}

function insertWouldMove(fromId: number, insertIndex: number, list: GalleryItem[]) {
  const from = list.findIndex((row) => row.id === fromId)
  if (from < 0) return false
  const to = insertIndex > from ? insertIndex - 1 : insertIndex
  return to !== from
}

const chipClass =
  'inline-flex max-w-full min-w-0 items-center gap-0.5 overflow-hidden border px-1.5 py-px text-[9px] leading-4 tracking-[0.04em] text-ellipsis whitespace-nowrap'

const fieldClass =
  'w-full border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:border-primary focus-visible:outline-none'

type PublishResult = {
  type: 'error'
  message: string
  at?: number
}

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const IMAGE_NAME_RE = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i

function isOsFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true
  return IMAGE_NAME_RE.test(file.name)
}

function snapshotImageFiles(files: ArrayLike<File>) {
  return Array.from(files).filter(isImageFile)
}

function imageFilesFromDrop(event: DragEvent) {
  const dt = event.dataTransfer
  if (!dt) return []
  const seen = new Set<string>()
  const out: File[] = []

  function add(file: File | null) {
    if (!file || !isImageFile(file)) return
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(file)
  }

  if (dt.items?.length) {
    for (let i = 0; i < dt.items.length; i += 1) {
      const item = dt.items[i]
      if (item.kind === 'file') add(item.getAsFile())
    }
  }
  for (let i = 0; i < dt.files.length; i += 1) add(dt.files[i])
  return out
}

function useOsFileDrop(enabled: boolean, onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false)
  const depthRef = useRef(0)
  const onFilesRef = useRef(onFiles)
  onFilesRef.current = onFiles

  function reset() {
    depthRef.current = 0
    setOver(false)
  }

  useEffect(() => {
    if (!enabled) reset()
  }, [enabled])

  return {
    over: over && enabled,
    handlers: {
      onDragEnter(event: DragEvent<HTMLElement>) {
        if (!enabled || !isOsFileDrag(event)) return
        event.preventDefault()
        event.stopPropagation()
        depthRef.current += 1
        setOver(true)
      },
      onDragOver(event: DragEvent<HTMLElement>) {
        if (!enabled || !isOsFileDrag(event)) return
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'copy'
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (!enabled || !isOsFileDrag(event)) return
        event.preventDefault()
        event.stopPropagation()
        depthRef.current = Math.max(0, depthRef.current - 1)
        if (depthRef.current === 0) setOver(false)
      },
      onDrop(event: DragEvent<HTMLElement>) {
        if (!enabled) return
        event.preventDefault()
        event.stopPropagation()
        const files = imageFilesFromDrop(event)
        reset()
        if (files.length) onFilesRef.current(files)
        else onFilesRef.current([])
      },
    },
  }
}

export function GalleryEditor() {
  const [rows, setRows] = useState<GalleryItem[]>(
    () => loadStoredGallery() ?? bundledGallery(),
  )
  const [extraTags, setExtraTags] = useState<string[]>(() => loadStoredExtraTags())
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [publishFlash, setPublishFlash] = useState(0)
  const [saveSource, setSaveSource] = useState<'header' | 'overlay' | null>(null)
  const [overlayResult, setOverlayResult] = useState<PublishResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dropBox, setDropBox] = useState<{
    top: number
    left: number
    width: number
    height: number
    vertical: boolean
  } | null>(null)
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{
    src: string
    alt: string
    focalX?: number
    focalY?: number
  } | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const uploadRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const ingestFilesRef = useRef<(
    files: FileList | File[],
    replaceFor?: number,
  ) => Promise<void>>(async () => {})
  const dragIdRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointRef = useRef<{ x: number; y: number } | null>(null)
  const rowsRef = useRef(rows)
  const skipClickRef = useRef(false)
  const liveSyncTimer = useRef<number | null>(null)
  const ingestingRef = useRef(false)
  rowsRef.current = rows

  useEffect(() => {
    if (dragId == null) return
    const { userSelect, cursor } = document.body.style
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    return () => {
      document.body.style.userSelect = userSelect
      document.body.style.cursor = cursor
    }
  }, [dragId])

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const remote = await fetchRemoteGallery()
      if (cancelled) return

      if (remote && remote.length > 0) {
        setRows(remote)
        persistGalleryLocal(remote)
        setExtraTags(loadStoredExtraTags())
        setStatus('Loaded the live gallery from Blob (order, captions, tags, and crops).')
        return
      }

      const local = loadStoredGallery()
      if (local && local.length > 0) {
        setRows(local)
        persistGalleryLocal(local)
        setExtraTags(loadStoredExtraTags())
        setStatus('Could not load Blob. Showing your saved gallery on this browser.')
        return
      }

      const bundled = bundledGallery()
      setRows(bundled)
      persistGalleryLocal(bundled)
      setExtraTags(loadStoredExtraTags())
    }
    void hydrate()
    return () => {
      cancelled = true
      if (liveSyncTimer.current) window.clearTimeout(liveSyncTimer.current)
    }
  }, [])

  const addDrop = useOsFileDrop(!uploading, (files) => {
    void ingestFilesRef.current(files)
  })

  function scheduleLiveSync(items: GalleryItem[]) {
    if (liveSyncTimer.current) window.clearTimeout(liveSyncTimer.current)
    liveSyncTimer.current = window.setTimeout(() => {
      const password = adminPassword()
      if (!password) return
      void saveGalleryRemote(items, password)
    }, 1200)
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      `${row.id} ${row.alt} ${row.caption ?? ''} ${row.tags.join(' ')} ${row.year ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [rows, query])

  const artistTagOptions = useMemo(
    () => getGalleryArtistTags(rows, extraTags),
    [rows, extraTags],
  )

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const rangeStart = visible.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * PAGE_SIZE, visible.length)

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  useEffect(() => {
    setOverlayResult(null)
  }, [expandedId])

  function updateRow(id: number, patch: Partial<GalleryItem>) {
    setRows((current) => {
      const next = current.map((row) => {
        if (row.id !== id) return row
        const updated = { ...row, ...patch }
        if (patch.tags || 'year' in patch) {
          updated.tags = galleryWithSyncedYear(updated.tags, updated.year)
          updated.category = galleryCategoryFromTags(updated.tags)
        }
        return updated
      })
      persistGalleryLocal(next)
      scheduleLiveSync(next)
      return next
    })
  }

  function toggleScene(id: number, tag: string) {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    const tags = row.tags.includes(tag)
      ? row.tags.filter((value) => value !== tag)
      : [...row.tags, tag]
    updateRow(id, { tags })
  }

  function toggleCustomTag(id: number, tag: string) {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    const tags = row.tags.includes(tag)
      ? row.tags.filter((value) => value !== tag)
      : [...row.tags, tag]
    updateRow(id, { tags })
  }

  function persistExtraTags(next: string[]) {
    const extra = sanitizeGalleryExtraTags(next)
    setExtraTags(extra)
    persistGalleryLocal(rowsRef.current, extra)
  }

  function removeExtraTag(tag: string) {
    if ((GALLERY_SCENE_TAGS as readonly string[]).includes(tag)) return
    persistExtraTags(extraTags.filter((value) => value !== tag))
  }

  function addCustomTag(id: number, raw: string) {
    const tag = raw.trim()
    if (!tag || GALLERY_YEAR_RE.test(tag)) return
    const row = rows.find((item) => item.id === id)
    if (!row || row.tags.includes(tag)) return
    updateRow(id, { tags: [...row.tags, tag] })
  }

  function addArtistTag(id: number, raw: string) {
    const tag = raw.trim()
    if (!tag || GALLERY_YEAR_RE.test(tag)) return
    if (extraTags.includes(tag)) {
      persistExtraTags(extraTags.filter((value) => value !== tag))
    }
    addCustomTag(id, tag)
  }

  function addExtraTag(id: number, raw: string) {
    const tag = raw.trim()
    if (!tag || GALLERY_YEAR_RE.test(tag)) return
    if (!(GALLERY_SCENE_TAGS as readonly string[]).includes(tag)) {
      persistExtraTags([...extraTags, tag])
    }
    addCustomTag(id, tag)
  }

  function removeRow(id: number) {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    setPendingDeleteIds([id])
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function togglePageSelected() {
    const pageIds = paged.map((row) => row.id)
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) => {
      if (allSelected) return current.filter((id) => !pageIds.includes(id))
      return [...new Set([...current, ...pageIds])]
    })
  }

  function removeSelected() {
    if (selectedIds.length === 0) return
    setPendingDeleteIds([...selectedIds])
  }

  function cancelDelete() {
    setPendingDeleteIds(null)
  }

  function confirmDelete() {
    if (!pendingDeleteIds?.length) return
    const ids = new Set(pendingDeleteIds)
    const n = pendingDeleteIds.length
    const next = rows.filter((item) => !ids.has(item.id))
    setRows(next)
    persistGalleryLocal(next)
    scheduleLiveSync(next)
    setSelectedIds((current) => current.filter((id) => !ids.has(id)))
    setExpandedId((current) => (current != null && ids.has(current) ? null : current))
    setPendingDeleteIds(null)
    setStatus(
      n === 1
        ? 'Photo removed — click Publish to site to keep the change.'
        : `${n} photos removed — click Publish to site to keep the change.`,
    )
  }

  const pendingDeletePhotos = useMemo(() => {
    if (!pendingDeleteIds?.length) return []
    const ids = new Set(pendingDeleteIds)
    return rows.filter((row) => ids.has(row.id))
  }, [pendingDeleteIds, rows])

  const editingRow =
    expandedId != null ? rows.find((row) => row.id === expandedId) ?? null : null
  const editingPosition = editingRow
    ? rows.findIndex((row) => row.id === editingRow.id) + 1
    : 0

  function moveRow(id: number, toIndex: number) {
    const from = rows.findIndex((row) => row.id === id)
    if (from < 0) return
    const last = rows.length - 1
    const clamped = Math.max(0, Math.min(last, toIndex))
    if (from === clamped) return
    const next = [...rows]
    const [item] = next.splice(from, 1)
    if (!item) return
    next.splice(clamped, 0, item)
    setRows(next)
    persistGalleryLocal(next)
    scheduleLiveSync(next)
    if (!query.trim()) {
      setPage(Math.floor(Math.max(0, clamped) / PAGE_SIZE) + 1)
    }
    setStatus('Order updated — click Publish to site.')
  }

  function moveRowToInsert(id: number, insertIndex: number) {
    const from = rows.findIndex((row) => row.id === id)
    if (from < 0) return
    const to = Math.max(
      0,
      Math.min(rows.length - 1, insertIndex > from ? insertIndex - 1 : insertIndex),
    )
    if (from === to) return
    const next = [...rows]
    const [item] = next.splice(from, 1)
    if (!item) return
    next.splice(to, 0, item)
    setRows(next)
    persistGalleryLocal(next)
    scheduleLiveSync(next)
    if (!query.trim()) {
      setPage(Math.floor(Math.max(0, to) / PAGE_SIZE) + 1)
    }
    setStatus('Order updated — click Publish to site.')
  }

  function updateDropFromPoint(x: number, y: number) {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-gallery-id]'),
    )
    if (cards.length === 0) return
    let best: HTMLElement | null = null
    let bestDist = Infinity
    for (const el of cards) {
      const rect = el.getBoundingClientRect()
      const dx = x - (rect.left + rect.width / 2)
      const dy = y - (rect.top + rect.height / 2)
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = el
      }
    }
    if (!best) return
    const targetId = Number(best.dataset.galleryId)
    const index = rowsRef.current.findIndex((row) => row.id === targetId)
    if (index < 0) return
    const rect = best.getBoundingClientRect()
    const cols = galleryGridCols()
    const before =
      cols === 1
        ? y < rect.top + rect.height / 2
        : x < rect.left + rect.width / 2
    const next = before ? index : index + 1
    dropIndexRef.current = next
    setDropIndex((current) => (current === next ? current : next))
    if (cols === 1) {
      setDropBox({
        top: before ? rect.top - 12 : rect.bottom - 8,
        left: rect.left + 20,
        width: Math.max(80, rect.width - 40),
        height: 22,
        vertical: false,
      })
    } else {
      setDropBox({
        top: rect.top + 16,
        left: before ? rect.left - 16 : rect.right - 12,
        width: 28,
        height: Math.max(64, rect.height - 32),
        vertical: true,
      })
    }
  }

  function beginPointerDrag(row: GalleryItem, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragIdRef.current = row.id
    dropIndexRef.current = null
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    dragPointRef.current = { x: event.clientX, y: event.clientY }
    skipClickRef.current = true
    setDragId(row.id)
    setDragPreview({
      src: row.src,
      alt: row.alt,
      focalX: row.focalX,
      focalY: row.focalY,
    })
    setDragPoint({ x: event.clientX, y: event.clientY })
    setDropIndex(null)
    setDropBox(null)
  }

  function movePointerDrag(event: PointerEvent<HTMLElement>) {
    if (dragIdRef.current == null) return
    dragPointRef.current = { x: event.clientX, y: event.clientY }
    setDragPoint({ x: event.clientX, y: event.clientY })
    const start = dragStartRef.current
    if (
      start &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
    ) {
      updateDropFromPoint(event.clientX, event.clientY)
    }
  }

  function endPointerDrag() {
    const fromId = dragIdRef.current
    const insertIndex = dropIndexRef.current
    const start = dragStartRef.current
    const point = dragPointRef.current
    const moved =
      start != null &&
      point != null &&
      Math.hypot(point.x - start.x, point.y - start.y) > 8
    dragIdRef.current = null
    dropIndexRef.current = null
    dragStartRef.current = null
    dragPointRef.current = null
    setDragId(null)
    setDropIndex(null)
    setDropBox(null)
    setDragPoint(null)
    setDragPreview(null)
    window.setTimeout(() => {
      skipClickRef.current = false
    }, 0)
    if (!moved || fromId == null || insertIndex == null) return
    moveRowToInsert(fromId, insertIndex)
  }

  async function handleSave(fromOverlay = false) {
    const next = rowsRef.current.map((item) => {
      const text = item.caption?.trim() || item.alt.trim()
      return { ...item, alt: text, caption: text }
    })
    setRows(next)
    setSaveSource(fromOverlay ? 'overlay' : 'header')
    setSaving(true)
    if (fromOverlay) setOverlayResult(null)
    else setPublishResult(null)
    setStatus('')
    persistGalleryLocal(next)
    const remote = await saveGalleryRemote(next, adminPassword())
    setSaving(false)
    const result =
      remote.ok
        ? null
        : {
            type: 'error' as const,
            message: remote.message || 'Publish failed. Try again.',
            at: Date.now(),
          }
    if (fromOverlay) setOverlayResult(result)
    else setPublishResult(result)
    setPublishFlash((current) => current + 1)
  }

  async function ingestFiles(files: FileList | File[], replaceFor?: number) {
    if (ingestingRef.current) return
    const queue = snapshotImageFiles(files)
    const work = replaceFor ? queue.slice(0, 1) : queue
    if (work.length === 0) {
      setStatus('Choose an image file.')
      return
    }

    ingestingRef.current = true
    setUploading(true)
    const password = adminPassword()
    let nextId = nextGalleryId(rowsRef.current)
    const added: GalleryItem[] = []
    let failed = 0

    try {
      for (const file of work) {
        try {
          const resized = await resizeImageFile(file)
          const id = replaceFor ?? nextId++
          const uploaded = await uploadGalleryImage(
            {
              blob: resized.blob,
              width: resized.width,
              height: resized.height,
              filename: resized.name,
              id,
            },
            password,
          )
          if (!uploaded.ok || !uploaded.src) {
            failed += 1
            continue
          }

          if (replaceFor) {
            setRows((current) => {
              const next = current.map((row) =>
                row.id === replaceFor
                  ? {
                      ...row,
                      src: srcForReplacePreview(uploaded.src!),
                      width: uploaded.width ?? resized.width,
                      height: uploaded.height ?? resized.height,
                      focalX: undefined,
                      focalY: undefined,
                    }
                  : row,
              )
              persistGalleryLocal(next)
              scheduleLiveSync(next)
              return next
            })
            setStatus('Photo replaced — click Save to keep it.')
          } else {
            const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
            added.push({
              id,
              src: uploaded.src,
              alt,
              caption: alt,
              category: 'Tour',
              tags: galleryWithSyncedYear(['Tour'], new Date().getFullYear()),
              year: new Date().getFullYear(),
              width: uploaded.width ?? resized.width,
              height: uploaded.height ?? resized.height,
            })
          }
        } catch {
          failed += 1
        }
      }

      if (added.length > 0) {
        const lastAdded = added[added.length - 1]
        setRows((current) => {
          const next = [...current, ...added]
          persistGalleryLocal(next)
          scheduleLiveSync(next)
          return next
        })
        setQuery('')
        setPage(
          Math.max(
            1,
            Math.ceil((rowsRef.current.length + added.length) / PAGE_SIZE),
          ),
        )
        setExpandedId(added.length === 1 ? added[0].id : null)
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            document
              .querySelector(`[data-gallery-id="${lastAdded.id}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        })
        if (failed > 0) {
          setStatus(
            `${added.length} photo${added.length === 1 ? '' : 's'} added, ${failed} failed.`,
          )
        } else {
          setStatus(
            added.length === 1
              ? 'Photo added — add a caption and tags, then Save.'
              : `${added.length} photos added — add captions and tags, then Save.`,
          )
        }
      } else if (!replaceFor && failed > 0) {
        setStatus(failed === 1 ? 'Upload failed.' : `${failed} uploads failed.`)
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      ingestingRef.current = false
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
      if (replaceRef.current) replaceRef.current.value = ''
    }
  }
  ingestFilesRef.current = ingestFiles

  return (
    <div
      className="relative mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-12 xl:px-14"
      {...addDrop.handlers}
    >
      {addDrop.over ? (
        <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-[1.25rem] border-2 border-dashed border-primary bg-black/80">
          <p className="font-heading px-6 text-center text-lg tracking-[0.12em] text-primary uppercase">
            Drop to add photos
          </p>
        </div>
      ) : null}
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <div className="glass-card space-y-3 p-5 sm:p-6">
          <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
            How to update the gallery
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>
              <span className="text-white">Add photos</span> with{' '}
              <span className="text-primary">Add new / Upload</span>, or drag one or more photos
              onto this page.
            </li>
            <li>
              <span className="text-white">Edit a photo</span> with the green{' '}
              <span className="text-primary">Edit</span> button: caption, tags, year, and order
              number. Use <span className="text-primary">Replace image</span> in that editor to
              swap the file without losing caption, tags, or order.
            </li>
            <li>
              <span className="text-white">Align the preview</span> in that editor: click and drag
              the photo in <span className="text-primary">Tile crop</span> until faces sit in the
              frame. Drag up if the head is cut off at the bottom; drag down if the top is cropped.
              The lightbox still shows the full photo. Click{' '}
              <span className="text-primary">Save</span> to keep it.
            </li>
            <li>
              <span className="text-white">Reorder</span> by dragging{' '}
              <span className="text-primary">Drag to reorder</span>. This is the same order visitors
              see on the gallery page.
            </li>
            <li>
              When it looks right, click{' '}
              <span className="text-primary">Publish to site</span>. That is what updates the live
              gallery.
            </li>
          </ol>
        </div>

        <div className="flex h-full min-h-[16rem] overflow-visible p-1">
          <div
            role="button"
            tabIndex={uploading ? -1 : 0}
            aria-disabled={uploading}
            aria-label="Drop photos to upload, or click to choose files"
            onClick={() => {
              if (!uploading) uploadRef.current?.click()
            }}
            onKeyDown={(event) => {
              if (uploading) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                uploadRef.current?.click()
              }
            }}
            className={cn(
              'flex h-full min-h-[16rem] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] border-2 border-dashed px-4 py-6 text-center transition-colors',
              addDrop.over
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted hover:border-primary hover:text-primary',
              uploading && 'pointer-events-none cursor-default opacity-60',
            )}
          >
            <ImagePlus size={28} aria-hidden />
            <p className="font-heading text-xs tracking-[0.14em] uppercase">
              {uploading ? 'Uploading…' : 'Drop photos here'}
            </p>
            <p className="max-w-xs text-[11px] leading-relaxed">
              One or many JPEG, PNG, or WebP files. Click to choose from your computer.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => uploadRef.current?.click()}
        >
          <ImagePlus size={14} aria-hidden />
          {uploading ? 'Uploading…' : 'Add new / Upload'}
        </Button>
        <div className="flex min-w-[11rem] flex-col items-stretch gap-1">
          <motion.div
            key={publishFlash}
            initial={false}
            animate={
              publishResult?.type === 'error'
                ? { x: [0, -6, 6, -4, 4, 0] }
                : { scale: 1, x: 0 }
            }
            transition={{ duration: 0.4 }}
          >
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              <Save size={14} aria-hidden />
              {saving ? 'Publishing…' : 'Publish to site'}
            </Button>
          </motion.div>
          <PublishFeedback result={publishResult} />
        </div>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void ingestFiles(e.target.files)
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const files = e.target.files
          const id = expandedId
          if (files && id != null) void ingestFiles(files, id)
        }}
      />
      {status ? (
        <p className="text-sm text-primary">
          <span className="font-heading tracking-[0.14em] uppercase">Status:</span> {status}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted">
            {visible.length} photos
            {visible.length > 0
              ? ` · ${rangeStart}–${rangeEnd}`
              : ''}
          </p>
          {paged.length > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={togglePageSelected}>
              {paged.every((row) => selectedIds.includes(row.id))
                ? 'Clear page'
                : 'Select page'}
            </Button>
          ) : null}
          {selectedIds.length > 0 ? (
            <>
              <span className="text-sm text-primary">
                {selectedIds.length} selected
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={removeSelected}>
                <Trash2 size={14} aria-hidden />
                Delete selected
              </Button>
            </>
          ) : null}
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search ID, caption, tags…"
          className="max-w-sm"
          aria-label="Search gallery"
        />
      </div>

      {pageCount > 1 ? (
        <GalleryPager
          page={safePage}
          pageCount={pageCount}
          label="Gallery pages top"
          onPage={setPage}
        />
      ) : null}

      <ul
        className={cn(
          'grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          dragId != null ? 'gap-6 overflow-visible select-none' : 'gap-3',
        )}
      >
        {paged.map((row) => {
          const position = rows.findIndex((item) => item.id === row.id) + 1
          const selectedArtists = galleryCustomTags(row.tags, extraTags)
          const selectedScenes = [
            ...GALLERY_SCENE_TAGS.filter((tag) => row.tags.includes(tag)),
            ...extraTags.filter((tag) => row.tags.includes(tag)),
          ]
          const dragging = dragId === row.id
          const selected = selectedIds.includes(row.id)
          return (
          <li
            key={row.id}
            data-gallery-id={row.id}
            className={cn(
              'glass-card admin-gallery-card relative min-w-0 w-full self-start p-2 sm:p-3 transition-all duration-150',
              dragging ? 'scale-[0.97] opacity-40 ring-2 ring-primary' : '',
              selected && !dragging ? 'ring-2 ring-primary' : '',
            )}
          >
            <div className="relative min-w-0 overflow-hidden">
            <div className="z-10 mb-2 flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2">
            <p className="font-heading shrink-0 text-2xl leading-none tracking-[0.06em] text-primary sm:text-3xl">
              {position}
            </p>
            <div
              role="button"
              tabIndex={0}
              onPointerDown={(event) => beginPointerDrag(row, event)}
              onPointerMove={movePointerDrag}
              onPointerUp={endPointerDrag}
              onPointerCancel={endPointerDrag}
              onLostPointerCapture={endPointerDrag}
              className={cn(
                'flex min-w-0 shrink touch-none items-center gap-1.5 rounded-md border px-2 py-1.5',
                'cursor-grab border-primary/70 bg-black/85 text-primary shadow-lg select-none',
                'hover:border-primary hover:bg-black active:cursor-grabbing',
                dragging ? 'border-primary bg-primary text-primary-foreground' : '',
              )}
              aria-label="Drag to reorder"
              title="Drag to reorder"
            >
              <GripVertical size={14} className="shrink-0" aria-hidden />
              <span className="font-heading truncate text-[9px] tracking-[0.14em] uppercase">
                {dragging ? 'Dragging…' : 'Drag to reorder'}
              </span>
            </div>
            <span className="min-w-0 flex-1" />
            <label
              className={cn(
                'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-black/85 shadow-lg',
                selected
                  ? 'border-primary text-primary'
                  : 'border-border text-muted hover:border-primary hover:text-primary',
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleSelected(row.id)}
                className="sr-only"
                aria-label={`Select photo ${position}`}
              />
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center border',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-current',
                )}
                aria-hidden
              >
                {selected ? <Check size={12} strokeWidth={3} /> : null}
              </span>
            </label>
            </div>
            <button
              type="button"
              className="block min-w-0 w-full text-left"
              aria-haspopup="dialog"
              onClick={() => {
                if (skipClickRef.current) return
                setExpandedId(row.id)
              }}
            >
              <GalleryPreview
                src={row.src}
                dragging={dragging}
                focalX={row.focalX}
                focalY={row.focalY}
              />
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {row.alt}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedArtists.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={cn(chipClass, 'border-primary/50 text-primary')}
                      >
                        {tag}
                      </span>
                    ))}
                    {selectedScenes.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          chipClass,
                          'font-heading uppercase text-muted',
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                    {selectedArtists.length + selectedScenes.length > 5 ? (
                      <span className={cn(chipClass, 'text-muted')}>
                        +{selectedArtists.length + selectedScenes.length - 5}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10px] tracking-[0.04em] text-muted">
                    Internal UID: {row.id}
                  </p>
                </div>
                <span className="font-heading shrink-0 bg-primary px-3.5 py-2 text-sm tracking-[0.16em] text-primary-foreground uppercase">
                  Edit
                </span>
              </div>
            </button>
            </div>
          </li>
          )
        })}
      </ul>

      {pageCount > 1 ? (
        <GalleryPager
          page={safePage}
          pageCount={pageCount}
          label="Gallery pages bottom"
          onPage={(next) => {
            setPage(next)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : null}

      {dropBox &&
      dragId != null &&
      dropIndex != null &&
      insertWouldMove(dragId, dropIndex, rows)
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[200] flex items-center justify-center"
              style={{
                top: dropBox.top,
                left: dropBox.left,
                width: dropBox.width,
                height: dropBox.height,
              }}
            >
              <div
                className={cn(
                  'gallery-insert-glow rounded-full',
                  dropBox.vertical ? 'h-full w-1.5' : 'h-1.5 w-full',
                )}
              />
              <span className="font-heading absolute whitespace-nowrap rounded-md border border-primary bg-black px-2 py-1 text-[10px] tracking-[0.14em] text-primary uppercase shadow-[0_0_20px_rgba(184,255,0,0.65)]">
                Drop here · {dropIndex + 1}
              </span>
            </div>,
            document.body,
          )
        : null}

      {dragPoint && dragPreview
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[160] w-36 overflow-hidden rounded-[1rem] border-2 border-primary shadow-[0_0_28px_rgba(184,255,0,0.45)]"
              style={{
                left: dragPoint.x + 14,
                top: dragPoint.y + 14,
              }}
            >
              <img
                src={dragPreview.src}
                alt={dragPreview.alt}
                className={cn(GALLERY_TILE_ASPECT_CLASS, 'h-auto w-full object-cover')}
                style={galleryTilePositionStyle(
                  dragPreview.focalX,
                  dragPreview.focalY,
                )}
              />
              <p className="font-heading absolute inset-x-0 bottom-0 bg-black/75 px-2 py-1 text-center text-[9px] tracking-[0.14em] text-primary uppercase">
                Drag to reorder
              </p>
            </div>,
            document.body,
          )
        : null}

      {editingRow ? (
        <GalleryDetailsOverlay
          row={editingRow}
          position={editingPosition}
          total={rows.length}
          artistTagOptions={artistTagOptions}
          extraTagOptions={extraTags}
          saving={saving && saveSource === 'overlay'}
          uploading={uploading}
          fileDropOver={addDrop.over}
          fileDropHandlers={addDrop.handlers}
          publishResult={overlayResult}
          deleteOpen={pendingDeletePhotos.length > 0}
          onClose={() => setExpandedId(null)}
          onUpdate={(patch) => updateRow(editingRow.id, patch)}
          onToggleScene={(tag) => toggleScene(editingRow.id, tag)}
          onToggleArtist={(tag) => toggleCustomTag(editingRow.id, tag)}
          onAddArtist={(tag) => addArtistTag(editingRow.id, tag)}
          onAddTag={(tag) => addExtraTag(editingRow.id, tag)}
          onRemoveTag={removeExtraTag}
          onMove={(toIndex) => moveRow(editingRow.id, toIndex)}
          onReplace={() => replaceRef.current?.click()}
          onSave={() => void handleSave(true)}
          onDelete={() => removeRow(editingRow.id)}
        />
      ) : null}

      <ConfirmDeleteDialog
        photos={pendingDeletePhotos}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function GalleryDetailsOverlay({
  row,
  position,
  total,
  artistTagOptions,
  extraTagOptions,
  saving,
  uploading,
  fileDropOver,
  fileDropHandlers,
  publishResult,
  deleteOpen,
  onClose,
  onUpdate,
  onToggleScene,
  onToggleArtist,
  onAddArtist,
  onAddTag,
  onRemoveTag,
  onMove,
  onReplace,
  onSave,
  onDelete,
}: {
  row: GalleryItem
  position: number
  total: number
  artistTagOptions: string[]
  extraTagOptions: string[]
  saving: boolean
  uploading: boolean
  fileDropOver: boolean
  fileDropHandlers: ReturnType<typeof useOsFileDrop>['handlers']
  publishResult: PublishResult | null
  deleteOpen: boolean
  onClose: () => void
  onUpdate: (patch: Partial<GalleryItem>) => void
  onToggleScene: (tag: string) => void
  onToggleArtist: (tag: string) => void
  onAddArtist: (tag: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onMove: (toIndex: number) => void
  onReplace: () => void
  onSave: () => void
  onDelete: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const ignoreBackdropUntil = useRef(0)
  const selectedArtists = galleryCustomTags(row.tags, extraTagOptions)

  useEffect(() => {
    ignoreBackdropUntil.current = Date.now() + 600
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (deleteOpen) return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [deleteOpen, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 py-8 sm:items-center"
      role="presentation"
      {...fileDropHandlers}
      onClick={(event) => {
        if (deleteOpen) return
        if (event.target !== event.currentTarget) return
        if (Date.now() < ignoreBackdropUntil.current) return
        onClose()
      }}
    >
      {fileDropOver ? (
        <div className="pointer-events-none absolute inset-3 z-[110] flex items-center justify-center rounded-[1.25rem] border-2 border-dashed border-primary bg-black/80">
          <p className="font-heading px-6 text-center text-lg tracking-[0.12em] text-primary uppercase">
            Drop to add photos
          </p>
        </div>
      ) : null}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-card relative my-auto w-full max-w-5xl space-y-5 p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-2xl leading-none tracking-[0.06em] text-primary sm:text-3xl">
              {position}
            </p>
            <h2
              id={titleId}
              className="mt-2 truncate text-sm text-white"
            >
              {row.alt || 'Photo details'}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close photo details"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted hover:border-primary hover:text-primary"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-8">
          <div className="space-y-3">
            <div className="relative">
              <FocalCropEditor
                src={row.src}
                width={row.width}
                height={row.height}
                focalX={row.focalX}
                focalY={row.focalY}
                onChange={(next) => onUpdate(next)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={onReplace}
            >
              <Replace size={14} aria-hidden />
              {uploading ? 'Uploading…' : 'Replace image'}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted">
              Click Replace image to swap the file.
            </p>
          </div>
          <div className="grid content-start gap-4">
            <label className="block">
              <span className="font-heading mb-1.5 block text-[10px] tracking-[0.14em] text-primary uppercase">
                Caption
              </span>
              <input
                className={fieldClass}
                value={row.alt}
                onChange={(e) =>
                  onUpdate({
                    alt: e.target.value,
                    caption: e.target.value,
                  })
                }
                placeholder="Shown on the photo in the lightbox"
              />
            </label>
            <label className="block w-24">
              <span className="font-heading mb-1.5 block text-[10px] tracking-[0.14em] text-primary uppercase">
                Year
              </span>
              <input
                className={cn(fieldClass, 'h-10')}
                inputMode="numeric"
                value={row.year ?? ''}
                onChange={(e) => {
                  const year = Number.parseInt(e.target.value, 10)
                  onUpdate({
                    year: Number.isFinite(year) ? year : undefined,
                  })
                }}
              />
            </label>
            <div>
              <span className="font-heading mb-1.5 block text-[10px] tracking-[0.14em] text-primary uppercase">
                Order
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <OrderInput
                  position={position}
                  total={total}
                  onCommit={(next) => onMove(next - 1)}
                />
                <IconButton
                  label="Move to top"
                  disabled={position <= 1}
                  onClick={() => onMove(0)}
                >
                  <ChevronsUp size={16} aria-hidden />
                </IconButton>
                <IconButton
                  label="Move up"
                  disabled={position <= 1}
                  onClick={() => onMove(position - 2)}
                >
                  <ArrowUp size={16} aria-hidden />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={position >= total}
                  onClick={() => onMove(position)}
                >
                  <ArrowDown size={16} aria-hidden />
                </IconButton>
                <IconButton
                  label="Move to bottom"
                  disabled={position >= total}
                  onClick={() => onMove(total - 1)}
                >
                  <ChevronsDown size={16} aria-hidden />
                </IconButton>
              </div>
            </div>
            <ArtistTagChips
              selected={selectedArtists}
              options={artistTagOptions}
              onToggle={onToggleArtist}
              onAdd={onAddArtist}
            />
            <div>
              <p className="font-heading mb-2 text-[10px] tracking-[0.14em] text-primary uppercase">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  ...GALLERY_SCENE_TAGS,
                  ...extraTagOptions,
                  ...row.tags.filter(
                    (tag) =>
                      !(GALLERY_SCENE_TAGS as readonly string[]).includes(tag) &&
                      !extraTagOptions.includes(tag) &&
                      !GALLERY_YEAR_RE.test(tag) &&
                      !selectedArtists.includes(tag),
                  ),
                ].map((tag) => {
                  const on = row.tags.includes(tag)
                  const preset = (GALLERY_SCENE_TAGS as readonly string[]).includes(tag)
                  const extra = extraTagOptions.includes(tag)
                  return (
                    <span
                      key={tag}
                      className={cn(
                        chipClass,
                        preset ? 'font-heading uppercase' : '',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted',
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggleScene(tag)}
                        className={cn(
                          'inline-flex min-w-0 items-center gap-0.5',
                          !on && 'hover:text-primary',
                        )}
                      >
                        {tag}
                        {on && !preset ? <X size={10} aria-hidden /> : null}
                      </button>
                      {extra && !on ? (
                        <button
                          type="button"
                          aria-label={`Remove ${tag} from tag list`}
                          title="Remove from tag list"
                          onClick={() => onRemoveTag(tag)}
                          className="inline-flex shrink-0 items-center text-muted hover:text-primary"
                        >
                          <X size={10} aria-hidden />
                        </button>
                      ) : null}
                    </span>
                  )
                })}
              </div>
              <AddTagField
                placeholder="Add tag"
                label="Add tag"
                onAdd={onAddTag}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-[11px] text-muted">Internal UID: {row.id}</p>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[7.5rem] flex-col items-stretch gap-1">
              <Button type="button" size="sm" onClick={onSave} disabled={saving}>
                <Save size={14} aria-hidden />
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <PublishFeedback result={publishResult} />
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 size={14} aria-hidden />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function GalleryPreview({
  src,
  dragging = false,
  focalX,
  focalY,
}: {
  src: string
  dragging?: boolean
  focalX?: number
  focalY?: number
}) {
  return (
    <div
      className={cn(
        'relative w-full min-w-0 overflow-hidden rounded-[1rem] border border-border bg-black',
        GALLERY_TILE_ASPECT_CLASS,
      )}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full min-h-0 min-w-0 max-w-none object-cover"
        style={galleryTilePositionStyle(focalX, focalY)}
      />
      {dragging ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="font-heading rounded-md border border-primary bg-black/85 px-2.5 py-1.5 text-[10px] tracking-[0.14em] text-primary uppercase">
            Dragging
          </p>
        </div>
      ) : null}
    </div>
  )
}

function FocalCropEditor({
  src,
  width,
  height,
  focalX,
  focalY,
  onChange,
}: {
  src: string
  width: number
  height: number
  focalX?: number
  focalY?: number
  onChange: (next: { focalX: number; focalY: number }) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    lastX: number
    lastY: number
    focalX: number
    focalY: number
  } | null>(null)
  const [panning, setPanning] = useState(false)
  const [live, setLive] = useState({
    focalX: clampGalleryFocal(focalX),
    focalY: clampGalleryFocal(focalY),
  })
  const x = panning ? live.focalX : clampGalleryFocal(focalX)
  const y = panning ? live.focalY : clampGalleryFocal(focalY)
  const custom = x !== 50 || y !== 50

  useEffect(() => {
    if (panning) return
    setLive({
      focalX: clampGalleryFocal(focalX),
      focalY: clampGalleryFocal(focalY),
    })
  }, [focalX, focalY, panning])

  function overflowFor(box: DOMRect) {
    const imgAspect = width / Math.max(height, 1)
    const boxAspect = box.width / Math.max(box.height, 1)
    const renderedW = imgAspect > boxAspect ? box.height * imgAspect : box.width
    const renderedH = imgAspect > boxAspect ? box.height : box.width / imgAspect
    return {
      x: Math.max(0, renderedW - box.width),
      y: Math.max(0, renderedH - box.height),
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const box = boxRef.current
    if (!box) return
    event.preventDefault()
    event.stopPropagation()
    box.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      focalX: x,
      focalY: y,
    }
    setPanning(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const box = boxRef.current
    if (!drag || !box || event.pointerId !== drag.pointerId) return
    event.preventDefault()
    const overflow = overflowFor(box.getBoundingClientRect())
    const dx = event.clientX - drag.lastX
    const dy = event.clientY - drag.lastY
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    if (overflow.x > 0) {
      drag.focalX = clampGalleryFocal(drag.focalX - (dx / overflow.x) * 100)
    }
    if (overflow.y > 0) {
      drag.focalY = clampGalleryFocal(drag.focalY - (dy / overflow.y) * 100)
    }
    setLive({ focalX: drag.focalX, focalY: drag.focalY })
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    setPanning(false)
    boxRef.current?.releasePointerCapture(event.pointerId)
    onChange({ focalX: drag.focalX, focalY: drag.focalY })
  }

  return (
    <div>
      <span className="font-heading mb-1.5 block text-[10px] tracking-[0.14em] text-primary uppercase">
        Tile crop
      </span>
      <p className="mb-2 text-[11px] leading-relaxed text-muted">
        This is the 4:3 preview visitors see on the gallery and artist pages. Click and drag the
        photo to align it until faces sit inside the frame. Then click Save. Opening the photo
        still shows the full image.
      </p>
      <div
        ref={boxRef}
        className={cn(
          'relative w-full min-w-0 touch-none overflow-hidden rounded-[1rem] border border-border bg-black',
          GALLERY_TILE_ASPECT_CLASS,
          panning ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={galleryTilePositionStyle(x, y)}
        />
        <p className="pointer-events-none absolute inset-x-0 top-2 text-center font-heading text-[9px] tracking-[0.14em] text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {panning ? 'Aligning…' : 'Drag to align'}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-snug text-muted">
          If a face is cut off at the bottom, drag the photo up. If the top is cropped, drag down.
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!custom}
          onClick={() => onChange({ focalX: 50, focalY: 50 })}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

function ConfirmDeleteDialog({
  photos,
  onCancel,
  onConfirm,
}: {
  photos: GalleryItem[]
  onCancel: () => void
  onConfirm: () => void
}) {
  const titleId = useId()
  const open = photos.length > 0
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onCancel])

  if (!open) return null

  const count = photos.length
  const previews = photos.slice(0, 6)

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-card w-full max-w-md space-y-5 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2
            id={titleId}
            className="font-heading text-lg tracking-[0.08em] text-white"
          >
            {count === 1 ? 'Delete this photo?' : `Delete ${count} photos?`}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {count === 1
              ? 'This removes it from the gallery. Publish to site to keep the change.'
              : 'This removes them from the gallery. Publish to site to keep the change.'}
          </p>
        </div>
        <div
          className={cn(
            'grid gap-2',
            previews.length === 1 ? 'grid-cols-1' : 'grid-cols-3',
          )}
        >
          {previews.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-[1rem] border border-border bg-surface"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className={cn(GALLERY_TILE_ASPECT_CLASS, 'h-full w-full object-cover')}
                style={galleryTilePositionStyle(photo.focalX, photo.focalY)}
              />
            </div>
          ))}
        </div>
        {count === 1 && photos[0]?.alt ? (
          <p className="truncate text-sm text-white">{photos[0].alt}</p>
        ) : null}
        {count > 6 ? (
          <p className="text-xs text-muted">+{count - 6} more</p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            size="sm"
            className="border border-red-400 bg-transparent text-red-400 hover:bg-red-400 hover:text-black"
            onClick={onConfirm}
          >
            <Trash2 size={14} aria-hidden />
            {count === 1 ? 'Delete photo' : `Delete ${count} photos`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function PublishFeedback({
  result,
}: {
  result: PublishResult | null
}) {
  if (!result) return null

  return (
    <div className="min-h-5" aria-live="polite">
      <p
        className="font-heading flex items-center justify-center gap-1 text-center text-[10px] tracking-[0.1em] text-red-400 uppercase"
        role="status"
      >
        <AlertCircle size={12} aria-hidden />
        {result.message}
      </p>
    </div>
  )
}

function ArtistTagChips({
  selected,
  options,
  onToggle,
  onAdd,
}: {
  selected: string[]
  options: string[]
  onToggle: (tag: string) => void
  onAdd: (tag: string) => void
}) {
  const chips = [...options]
  for (const tag of selected) {
    if (!chips.includes(tag)) chips.push(tag)
  }

  return (
    <div>
      <p className="font-heading mb-2 text-[10px] tracking-[0.14em] text-primary uppercase">
        Artists
      </p>
      <div className="flex flex-wrap gap-1">
        {chips.map((tag) => {
          const on = selected.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(tag)}
              className={cn(
                chipClass,
                on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted hover:border-primary hover:text-primary',
              )}
            >
              {tag}
              {on ? <X size={10} aria-hidden /> : null}
            </button>
          )
        })}
      </div>
      <AddTagField
        placeholder="Add artist name"
        label="Add artist tag"
        buttonLabel="Add"
        onAdd={onAdd}
      />
    </div>
  )
}

function AddTagField({
  placeholder,
  label,
  buttonLabel = 'Add tags',
  onAdd,
}: {
  placeholder: string
  label: string
  buttonLabel?: string
  onAdd: (tag: string) => void
}) {
  const [draft, setDraft] = useState('')

  function submit() {
    const tag = draft.trim()
    if (!tag) return
    onAdd(tag)
    setDraft('')
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        className={cn(fieldClass, 'h-10')}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        aria-label={label}
      />
      <Button type="button" size="sm" variant="outline" onClick={submit}>
        <Plus size={14} aria-hidden />
        {buttonLabel}
      </Button>
    </div>
  )
}

function OrderInput({
  position,
  total,
  onCommit,
}: {
  position: number
  total: number
  onCommit: (position: number) => void
}) {
  const [value, setValue] = useState(String(position))

  useEffect(() => {
    setValue(String(position))
  }, [position])

  function commit() {
    const next = Number.parseInt(value, 10)
    if (!Number.isFinite(next)) {
      setValue(String(position))
      return
    }
    onCommit(Math.max(1, Math.min(total, next)))
  }

  return (
    <input
      className={cn(fieldClass, 'h-10 w-16 shrink-0')}
      inputMode="numeric"
      value={value}
      aria-label="Gallery order"
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
      }}
    />
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted',
        disabled
          ? 'cursor-not-allowed opacity-30'
          : 'hover:border-primary hover:text-primary',
      )}
    >
      {children}
    </button>
  )
}
