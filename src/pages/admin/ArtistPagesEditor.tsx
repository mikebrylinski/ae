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
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsDown,
  ChevronsUp,
  GripVertical,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGalleryPayload,
  nextGalleryId,
  persistGalleryLocal,
  saveArtistOrderRemote,
  saveGalleryRemote,
  uploadGalleryImage,
  type ArtistGalleryOrderMap,
} from '@/lib/galleryAdmin'
import { getAdminPassword, getSessionPassword } from '@/lib/admin'
import {
  galleryItemMatchesArtist,
  galleryWithSyncedYear,
  projects,
  resolveProjectGallerySources,
  type ProjectGallerySource,
} from '@/lib/content'
import { captionForNewUpload, readEmbeddedImageCaption } from '@/lib/imageCaption'
import { resizeImageFile } from '@/lib/resizeImage'
import {
  GALLERY_TILE_ASPECT_CLASS,
  galleryTilePositionStyle,
} from '@/lib/galleryFocal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
}

const IMAGE_NAME_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true
  return IMAGE_NAME_RE.test(file.name)
}

function snapshotImageFiles(files: ArrayLike<File>) {
  return Array.from(files).filter(isImageFile)
}

function projectYearHint(year: string): number {
  const years = [...year.matchAll(/\d{4}/g)].map((match) => Number.parseInt(match[0], 10))
  return years.length ? Math.max(...years) : new Date().getFullYear()
}

function sourceFromItem(item: GalleryItem): ProjectGallerySource {
  return {
    id: item.id,
    src: item.src,
    alt: item.alt,
    caption: item.caption || item.alt,
    focalX: item.focalX,
    focalY: item.focalY,
  }
}

function galleryGridCols() {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 640px)').matches) return 2
  return 1
}

function insertWouldMove(fromId: number, insertIndex: number, list: ProjectGallerySource[]) {
  const from = list.findIndex((row) => row.id === fromId)
  if (from < 0) return false
  const to = insertIndex > from ? insertIndex - 1 : insertIndex
  return to !== from
}

function idsOf(rows: ProjectGallerySource[]) {
  return rows.map((row) => row.id).filter((id): id is number => id != null)
}

function idsKey(ids: number[]) {
  return ids.join(',')
}

function projectRecency(year: string): number {
  if (/present|current/i.test(year)) return Number.POSITIVE_INFINITY
  const years = [...year.matchAll(/\d{4}/g)].map((match) => Number.parseInt(match[0], 10))
  return years.length ? Math.max(...years) : 0
}

const projectOptions = [...projects].sort((a, b) => {
  const recency = projectRecency(b.year) - projectRecency(a.year)
  if (recency !== 0) return recency
  return a.artist.localeCompare(b.artist)
})

export function ArtistPagesEditor() {
  const [items, setItems] = useState<GalleryItem[]>(() => bundledGallery())
  const [artistOrder, setArtistOrder] = useState<ArtistGalleryOrderMap>({})
  const [slug, setSlug] = useState(projectOptions[0]?.slug ?? '')
  const [rows, setRows] = useState<ProjectGallerySource[]>([])
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishResult, setPublishResult] = useState<{
    type: 'ok' | 'error'
    message: string
  } | null>(null)
  const [publishFlash, setPublishFlash] = useState(0)
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
  const [dragPreview, setDragPreview] = useState<ProjectGallerySource | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadOver, setUploadOver] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null)

  const rowsRef = useRef(rows)
  const itemsRef = useRef(items)
  const uploadRef = useRef<HTMLInputElement>(null)
  const ingestingRef = useRef(false)
  const uploadDepthRef = useRef(0)
  const dragIdRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointRef = useRef<{ x: number; y: number } | null>(null)
  const draftsRef = useRef<Record<string, number[]>>({})
  const publishedRef = useRef<Record<string, string>>({})
  const galleryDirtyRef = useRef(false)

  rowsRef.current = rows
  itemsRef.current = items

  const project = projectOptions.find((item) => item.slug === slug)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const remote = await fetchRemoteGalleryPayload()
      if (cancelled) return
      const nextItems =
        remote?.items && remote.items.length > 0 ? remote.items : bundledGallery()
      const nextOrder = remote?.artistOrder ?? {}
      setItems(nextItems)
      setArtistOrder(nextOrder)
      setReady(true)
      setStatus('Loaded live gallery. Artist page order is independent of /gallery.')
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !project) {
      if (!project) setRows([])
      return
    }
    const draft = draftsRef.current[project.slug]
    const sources = resolveProjectGallerySources(
      project.gallery,
      project.artist,
      project.slug,
      items,
      draft ?? artistOrder[project.slug],
    )
    setRows(sources)
    if (!publishedRef.current[project.slug]) {
      publishedRef.current[project.slug] = idsKey(idsOf(sources))
    }
  }, [artistOrder, items, project, ready])

  const dirty = project
    ? idsKey(idsOf(rows)) !== (publishedRef.current[project.slug] ?? '')
    : false

  function rememberDraft(next: ProjectGallerySource[]) {
    if (!project) return
    draftsRef.current[project.slug] = idsOf(next)
  }

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
    rememberDraft(next)
    setPublishResult(null)
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
    rememberDraft(next)
    setPublishResult(null)
    setStatus('Order updated — click Publish to site.')
  }

  function removeFromPage(id: number) {
    if (!project) return
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) return
    const nextItems = itemsRef.current.map((item) => {
      if (item.id !== id) return item
      const tags = item.tags.filter(
        (tag) => !galleryItemMatchesArtist({ ...item, tags: [tag] }, project.artist),
      )
      return tags.length === item.tags.length ? item : { ...item, tags }
    })
    itemsRef.current = nextItems
    galleryDirtyRef.current = true
    setItems(nextItems)
    setRows(next)
    rememberDraft(next)
    setPendingRemoveId(null)
    setPublishResult(null)
    setStatus('Removed from this artist page — click Publish to site.')
  }

  const pendingRemovePhoto = useMemo(
    () => (pendingRemoveId == null ? null : rows.find((row) => row.id === pendingRemoveId) ?? null),
    [pendingRemoveId, rows],
  )

  async function ingestFiles(files: ArrayLike<File>) {
    if (!project || ingestingRef.current) return
    const work = snapshotImageFiles(files)
    if (work.length === 0) {
      setStatus('Choose an image file.')
      return
    }

    ingestingRef.current = true
    setUploading(true)
    setPublishResult(null)
    const password = adminPassword()
    let nextId = nextGalleryId(itemsRef.current)
    const year = projectYearHint(project.year)
    const added: GalleryItem[] = []
    let failed = 0

    try {
      for (const file of work) {
        try {
          const [resized, embeddedCaption] = await Promise.all([
            resizeImageFile(file),
            readEmbeddedImageCaption(file),
          ])
          const id = nextId++
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
          const alt = captionForNewUpload(file, embeddedCaption, project.artist)
          added.push({
            id,
            src: uploaded.src,
            alt,
            caption: alt,
            category: 'Tour',
            tags: galleryWithSyncedYear(['Tour', project.artist], year),
            year,
            width: uploaded.width ?? resized.width,
            height: uploaded.height ?? resized.height,
          })
        } catch {
          failed += 1
        }
      }

      if (added.length > 0) {
        const nextItems = [...itemsRef.current, ...added]
        const nextRows = [...rowsRef.current, ...added.map(sourceFromItem)]
        const nextIds = idsOf(nextRows)
        itemsRef.current = nextItems
        draftsRef.current[project.slug] = nextIds
        setItems(nextItems)
        setRows(nextRows)
        persistGalleryLocal(nextItems)
        const remote = await saveGalleryRemote(nextItems, password)
        if (!remote.ok) {
          setPublishResult({
            type: 'error',
            message: remote.message || 'Gallery save failed after upload.',
          })
          setStatus(
            `Added ${added.length} to this page, but gallery publish failed — try Publish again from Gallery.`,
          )
        } else {
          const orderRemote = await saveArtistOrderRemote(
            project.slug,
            nextIds,
            password,
          )
          if (!orderRemote.ok) {
            setPublishResult({
              type: 'error',
              message: orderRemote.message || 'Artist order save failed after upload.',
            })
            setStatus(
              `Photos are in Gallery, but artist page order did not publish — click Publish to site.`,
            )
          } else {
            publishedRef.current[project.slug] = idsKey(nextIds)
            setArtistOrder((current) => ({ ...current, [project.slug]: nextIds }))
            setPublishResult({
              type: 'ok',
              message: 'Photos added',
            })
            setStatus(
              failed > 0
                ? `Added ${added.length} photo${added.length === 1 ? '' : 's'} to this page and Gallery (${failed} failed).`
                : `Added ${added.length} photo${added.length === 1 ? '' : 's'} to this page and the end of Gallery.`,
            )
          }
        }
      } else if (failed > 0) {
        setStatus(failed === 1 ? 'Upload failed.' : `${failed} uploads failed.`)
      }
    } finally {
      ingestingRef.current = false
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  function onUploadDragEnter(event: DragEvent<HTMLElement>) {
    if (uploading || !isOsFileDrag(event)) return
    event.preventDefault()
    event.stopPropagation()
    uploadDepthRef.current += 1
    setUploadOver(true)
  }

  function onUploadDragOver(event: DragEvent<HTMLElement>) {
    if (uploading || !isOsFileDrag(event)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
  }

  function onUploadDragLeave(event: DragEvent<HTMLElement>) {
    if (uploading || !isOsFileDrag(event)) return
    event.preventDefault()
    event.stopPropagation()
    uploadDepthRef.current = Math.max(0, uploadDepthRef.current - 1)
    if (uploadDepthRef.current === 0) setUploadOver(false)
  }

  function onUploadDrop(event: DragEvent<HTMLElement>) {
    if (uploading) return
    event.preventDefault()
    event.stopPropagation()
    uploadDepthRef.current = 0
    setUploadOver(false)
    const files = snapshotImageFiles(event.dataTransfer?.files ?? [])
    if (files.length) void ingestFiles(files)
  }

  function isOsFileDrag(event: DragEvent) {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  function updateDropFromPoint(x: number, y: number) {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-artist-gallery-id]'),
    )
    let best: HTMLElement | null = null
    let bestDist = Infinity
    for (const card of cards) {
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < bestDist) {
        best = card
        bestDist = dist
      }
    }
    if (!best) return
    const targetId = Number(best.dataset.artistGalleryId)
    const index = rowsRef.current.findIndex((row) => row.id === targetId)
    if (index < 0) return
    const rect = best.getBoundingClientRect()
    const cols = galleryGridCols()
    const before =
      cols === 1 ? y < rect.top + rect.height / 2 : x < rect.left + rect.width / 2
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

  function beginPointerDrag(row: ProjectGallerySource, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || row.id == null) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragIdRef.current = row.id
    dropIndexRef.current = null
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    dragPointRef.current = { x: event.clientX, y: event.clientY }
    setDragId(row.id)
    setDragPreview(row)
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
    if (!moved || fromId == null || insertIndex == null) return
    moveRowToInsert(fromId, insertIndex)
  }

  async function handleSave() {
    if (!project) return
    const ids = idsOf(rows)
    setSaving(true)
    setPublishResult(null)
    const password = adminPassword()
    if (galleryDirtyRef.current) {
      persistGalleryLocal(itemsRef.current)
      const galleryRemote = await saveGalleryRemote(itemsRef.current, password)
      if (!galleryRemote.ok) {
        setSaving(false)
        setPublishFlash((current) => current + 1)
        setPublishResult({
          type: 'error',
          message: galleryRemote.message || 'Gallery save failed. Try again.',
        })
        setStatus('')
        return
      }
      galleryDirtyRef.current = false
    }
    const remote = await saveArtistOrderRemote(project.slug, ids, password)
    setSaving(false)
    setPublishFlash((current) => current + 1)
    if (!remote.ok) {
      setPublishResult({
        type: 'error',
        message: remote.message || 'Publish failed. Try again.',
      })
      setStatus('')
      return
    }
    publishedRef.current[project.slug] = idsKey(ids)
    draftsRef.current[project.slug] = ids
    setArtistOrder((current) => ({ ...current, [project.slug]: ids }))
    setPublishResult({
      type: 'ok',
      message: 'Artist gallery updated',
    })
    setStatus(`${project.artist} page gallery is live.`)
  }

  const selectOptions = useMemo(
    () =>
      projectOptions.map((item) => ({
        slug: item.slug,
        label: `${item.artist} — ${item.year}`,
      })),
    [],
  )

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
      <div className="glass-card space-y-4 p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-start">
          <div className="space-y-4">
            <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
              Artist page galleries
            </p>
            <p className="text-sm leading-relaxed text-muted">
              This is separate from the main Gallery page. Order here only affects this artist’s
              portfolio page.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Upload photos here to add them to this artist page and append them to the end of the
              main Gallery (saved live). A caption saved in the photo comes with it; otherwise the
              file name is used. Drag to reorder, then Publish. Removing a photo here only drops it
              from this page — it stays in Gallery unless you delete it there.
            </p>
            <label className="block max-w-lg">
              <span className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
                Artist
              </span>
              <select
                value={slug}
                onChange={(event) => {
                  if (project) draftsRef.current[project.slug] = idsOf(rows)
                  setSlug(event.target.value)
                  setPublishResult(null)
                }}
                className="w-full border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
              >
                {selectOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            role="button"
            tabIndex={uploading || !project ? -1 : 0}
            aria-disabled={uploading || !project}
            aria-label="Drop photos to upload, or click to choose files"
            onClick={() => {
              if (!uploading && project) uploadRef.current?.click()
            }}
            onKeyDown={(event) => {
              if (uploading || !project) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                uploadRef.current?.click()
              }
            }}
            onDragEnter={onUploadDragEnter}
            onDragOver={onUploadDragOver}
            onDragLeave={onUploadDragLeave}
            onDrop={onUploadDrop}
            className={cn(
              'flex min-h-[10rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[0.75rem] border border-dashed px-4 py-5 text-center transition-colors lg:min-h-full',
              uploadOver
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-black/40 text-muted hover:border-primary/50 hover:text-primary',
              (uploading || !project) && 'pointer-events-none cursor-default opacity-60',
            )}
          >
            <Upload size={18} aria-hidden />
            <p className="font-heading text-xs tracking-[0.14em] uppercase">
              {uploading ? 'Uploading…' : 'Drop photos here'}
            </p>
            <p className="text-xs text-muted">
              Adds to this artist page and the end of the main Gallery
            </p>
          </div>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files
            if (files?.length) void ingestFiles(files)
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            {rows.length} photo{rows.length === 1 ? '' : 's'}
            {dirty ? ' · unpublished changes' : ''}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading || !project}
            onClick={() => uploadRef.current?.click()}
          >
            <Upload size={14} aria-hidden />
            {uploading ? 'Uploading…' : 'Add photos'}
          </Button>
          <div className="ml-auto flex min-w-[11rem] flex-col items-stretch gap-1">
            <motion.div
              key={publishFlash}
              initial={false}
              animate={
                publishResult?.type === 'error'
                  ? { x: [0, -6, 6, -4, 4, 0] }
                  : publishResult?.type === 'ok'
                    ? { scale: [1, 1.03, 1] }
                    : { scale: 1, x: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => void handleSave()}
                disabled={saving || !project || uploading}
              >
                <Save size={14} aria-hidden />
                {saving ? 'Publishing…' : 'Publish to site'}
              </Button>
            </motion.div>
            {publishResult ? (
              <p
                className={cn(
                  'font-heading flex items-center justify-center gap-1 text-center text-[10px] tracking-[0.1em] uppercase',
                  publishResult.type === 'ok' ? 'text-primary' : 'text-red-400',
                )}
                role="status"
              >
                {publishResult.type === 'ok' ? (
                  <Check size={12} strokeWidth={3} aria-hidden />
                ) : (
                  <AlertCircle size={12} aria-hidden />
                )}
                {publishResult.message}
              </p>
            ) : null}
          </div>
        </div>
        {status ? (
          <p className="text-sm text-primary" aria-live="polite">
            <span className="font-heading tracking-[0.14em] uppercase">Status:</span> {status}
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No photos yet. Drop images above or click Add photos — they&apos;ll be tagged for this
          artist and added to the end of the main Gallery.
        </p>
      ) : (
        <ul
          className={cn(
            'grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3',
            dragId != null ? 'gap-6 overflow-visible select-none' : 'gap-3',
          )}
        >
          {rows.map((row, index) => {
            const dragging = dragId === row.id
            return (
              <li
                key={row.id ?? row.src}
                data-artist-gallery-id={row.id}
                className={cn(
                  'glass-card relative min-w-0 w-full self-start p-2 sm:p-3 transition-all duration-150',
                  dragging ? 'scale-[0.97] opacity-40 ring-2 ring-primary' : '',
                )}
              >
                <div className="z-10 mb-2 flex min-w-0 items-center gap-1.5">
                  <p className="font-heading shrink-0 text-2xl leading-none tracking-[0.06em] text-primary sm:text-3xl">
                    {index + 1}
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
                      {dragging ? 'Dragging…' : 'Drag'}
                    </span>
                  </div>
                  <span className="min-w-0 flex-1" />
                  <div className="flex shrink-0 gap-1">
                    <IconMove
                      label="Move to top"
                      onClick={() => row.id != null && moveRow(row.id, 0)}
                      disabled={index === 0}
                    >
                      <ChevronsUp size={14} />
                    </IconMove>
                    <IconMove
                      label="Move up"
                      onClick={() => row.id != null && moveRow(row.id, index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowUp size={14} />
                    </IconMove>
                    <IconMove
                      label="Move down"
                      onClick={() => row.id != null && moveRow(row.id, index + 1)}
                      disabled={index === rows.length - 1}
                    >
                      <ArrowDown size={14} />
                    </IconMove>
                    <IconMove
                      label="Move to bottom"
                      onClick={() => row.id != null && moveRow(row.id, rows.length - 1)}
                      disabled={index === rows.length - 1}
                    >
                      <ChevronsDown size={14} />
                    </IconMove>
                    <IconMove
                      label="Remove from this page"
                      onClick={() => row.id != null && setPendingRemoveId(row.id)}
                    >
                      <Trash2 size={14} />
                    </IconMove>
                  </div>
                </div>
                <div
                  className={cn(
                    'relative w-full min-w-0 overflow-hidden rounded-[1rem] border border-border bg-black',
                    GALLERY_TILE_ASPECT_CLASS,
                  )}
                >
                  <img
                    src={row.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={galleryTilePositionStyle(row.focalX, row.focalY)}
                  />
                </div>
                <p className="mt-2 truncate text-sm text-white">{row.alt || row.caption}</p>
                {row.id != null ? (
                  <p className="mt-1 text-[10px] tracking-[0.04em] text-muted">
                    Internal UID: {row.id}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

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
                alt=""
                className={cn(GALLERY_TILE_ASPECT_CLASS, 'h-auto w-full object-cover')}
                style={galleryTilePositionStyle(dragPreview.focalX, dragPreview.focalY)}
              />
            </div>,
            document.body,
          )
        : null}

      <ConfirmRemoveDialog
        photo={pendingRemovePhoto}
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={() => {
          if (pendingRemoveId != null) removeFromPage(pendingRemoveId)
        }}
      />
    </div>
  )
}

function ConfirmRemoveDialog({
  photo,
  onCancel,
  onConfirm,
}: {
  photo: ProjectGallerySource | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const titleId = useId()
  const open = photo != null
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

  if (!photo) return null

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
            Remove from this page?
          </h2>
          <p className="mt-2 text-sm text-muted">
            It stays in the main Gallery. Publish to site to keep this change.
          </p>
        </div>
        <div className="overflow-hidden rounded-[1rem] border border-border bg-surface">
          <img
            src={photo.src}
            alt={photo.alt}
            className={cn(GALLERY_TILE_ASPECT_CLASS, 'h-full w-full object-cover')}
            style={galleryTilePositionStyle(photo.focalX, photo.focalY)}
          />
        </div>
        {photo.alt || photo.caption ? (
          <p className="truncate text-sm text-white">{photo.alt || photo.caption}</p>
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
            Remove from page
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function IconMove({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30"
    >
      {children}
    </button>
  )
}
