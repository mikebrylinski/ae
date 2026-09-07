import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowDown, ArrowUp, Check, CheckCircle2, ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, GripVertical, ImagePlus, Plus, Save, Trash2, X } from 'lucide-react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGallery,
  loadStoredGallery,
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
} from '@/lib/content'
import { resizeImageFile } from '@/lib/resizeImage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 24

function galleryGridCols() {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1280px)').matches) return 4
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 640px)').matches) return 2
  return 1
}

function insertWouldMove(fromId: number, insertIndex: number, list: GalleryItem[]) {
  const from = list.findIndex((row) => row.id === fromId)
  if (from < 0) return false
  const to = insertIndex > from ? insertIndex - 1 : insertIndex
  return to !== from
}

const chipClass =
  'inline-flex max-w-full min-w-0 items-center gap-0.5 overflow-hidden border px-1.5 py-px text-[9px] leading-4 tracking-[0.04em] text-ellipsis whitespace-nowrap'

function pageWindow(current: number, total: number): Array<number | 'gap'> {
  const pages: Array<number | 'gap'> = []
  for (let i = 1; i <= total; i++) {
    const show = i === 1 || i === total || Math.abs(i - current) <= 1
    if (show) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap')
    }
  }
  return pages
}

const fieldClass =
  'w-full border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:border-primary focus-visible:outline-none'

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
}

export function GalleryEditor() {
  const [rows, setRows] = useState<GalleryItem[]>(
    () => loadStoredGallery() ?? bundledGallery(),
  )
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishResult, setPublishResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [publishFlash, setPublishFlash] = useState(0)
  const [saveSource, setSaveSource] = useState<'header' | 'overlay' | null>(null)
  const [overlayResult, setOverlayResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
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
  const [dragPreview, setDragPreview] = useState<{ src: string; alt: string } | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const uploadRef = useRef<HTMLInputElement>(null)
  const dragIdRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointRef = useRef<{ x: number; y: number } | null>(null)
  const rowsRef = useRef(rows)
  const skipClickRef = useRef(false)
  rowsRef.current = rows

  useEffect(() => {
    if (publishResult?.type !== 'success') return
    const timer = window.setTimeout(() => setPublishResult(null), 30_000)
    return () => window.clearTimeout(timer)
  }, [publishResult])

  useEffect(() => {
    if (overlayResult?.type !== 'success') return
    const timer = window.setTimeout(() => setOverlayResult(null), 30_000)
    return () => window.clearTimeout(timer)
  }, [overlayResult])

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
      if (loadStoredGallery()) return
      const remote = await fetchRemoteGallery()
      if (!cancelled && remote) setRows(remote)
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      `${row.id} ${row.alt} ${row.caption ?? ''} ${row.tags.join(' ')} ${row.year ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [rows, query])

  const artistTagOptions = useMemo(() => getGalleryArtistTags(rows), [rows])

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
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        if (patch.tags || 'year' in patch) {
          next.tags = galleryWithSyncedYear(next.tags, next.year)
          next.category = galleryCategoryFromTags(next.tags)
        }
        return next
      }),
    )
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

  function addCustomTag(id: number, raw: string) {
    const tag = raw.trim()
    if (!tag || GALLERY_YEAR_RE.test(tag)) return
    const row = rows.find((item) => item.id === id)
    if (!row || row.tags.includes(tag)) return
    updateRow(id, { tags: [...row.tags, tag] })
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
    setDragPreview({ src: row.src, alt: row.alt })
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

  function withCaptionFromAlt(items: GalleryItem[]) {
    return items.map((item) => ({ ...item, caption: item.alt }))
  }

  async function handleSave(fromOverlay = false) {
    const next = withCaptionFromAlt(rows)
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
      remote.ok && remote.file
        ? {
            type: 'success' as const,
            message: 'Published to the live gallery.',
          }
        : remote.ok
          ? {
              type: 'success' as const,
              message: remote.message || 'Saved. Dev server will write the file.',
            }
          : {
              type: 'error' as const,
              message: remote.message || 'Publish failed. Try again.',
            }
    if (fromOverlay) setOverlayResult(result)
    else setPublishResult(result)
    setPublishFlash((current) => current + 1)
  }

  async function ingestFiles(files: FileList | File[], replaceFor?: number) {
    const list = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (list.length === 0) {
      setStatus('Choose an image file.')
      return
    }

    setUploading(true)
    const password = adminPassword()
    const added: GalleryItem[] = []
    let nextId = nextGalleryId(rows)

    try {
      for (const file of list) {
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
          setStatus(uploaded.message || 'Upload failed.')
          setUploading(false)
          return
        }

        if (replaceFor) {
          setRows((current) =>
            current.map((row) =>
              row.id === replaceFor
                ? {
                    ...row,
                    src: uploaded.src!,
                    width: uploaded.width ?? resized.width,
                    height: uploaded.height ?? resized.height,
                  }
                : row,
            ),
          )
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
      }

      if (added.length > 0) {
        setRows((current) => {
          const next = [...added, ...current]
          persistGalleryLocal(next)
          return next
        })
        setPage(1)
        setExpandedId(added[0]?.id ?? null)
        setStatus(
          added.length === 1
            ? 'Photo added — add a caption and tags, then Save.'
            : `${added.length} photos added — add captions and tags, then Save.`,
        )
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
      <div className="glass-card space-y-3 p-5 sm:p-6">
        <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
          How to update the gallery
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-white">Add photos</span> with{' '}
            <span className="text-primary">Add new / Upload</span>.
          </li>
          <li>
            <span className="text-white">Edit a photo</span> with the green{' '}
            <span className="text-primary">Edit</span> button: caption, tags, year, and order number.
          </li>
          <li>
            <span className="text-white">Reorder</span> by dragging{' '}
            <span className="text-primary">Drag to reorder</span>. This is the same order visitors see
            on the gallery page.
          </li>
          <li>
            When it looks right, click{' '}
            <span className="text-primary">Publish to site</span>. That is what updates the live
            gallery.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg tracking-[0.08em]">Gallery photos</h2>
          <p className="mt-1 text-sm text-muted">
            Drag to reorder, then publish when you are ready.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
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
                  : publishResult?.type === 'success'
                    ? { scale: [1, 1.05, 1] }
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
            <PublishFeedback result={publishResult} saving={saving} />
          </div>
        </div>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void ingestFiles(e.target.files)
        }}
      />
      {status ? <p className="text-sm text-primary">{status}</p> : null}

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
          const selectedArtists = galleryCustomTags(row.tags)
          const selectedScenes = GALLERY_SCENE_TAGS.filter((tag) =>
            row.tags.includes(tag),
          )
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
              <GalleryPreview src={row.src} dragging={dragging} />
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
                className="aspect-[4/3] h-auto w-full object-cover"
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
          saving={saving && saveSource === 'overlay'}
          publishResult={overlayResult}
          deleteOpen={pendingDeletePhotos.length > 0}
          onClose={() => setExpandedId(null)}
          onUpdate={(patch) => updateRow(editingRow.id, patch)}
          onToggleScene={(tag) => toggleScene(editingRow.id, tag)}
          onToggleArtist={(tag) => toggleCustomTag(editingRow.id, tag)}
          onAddTag={(tag) => addCustomTag(editingRow.id, tag)}
          onMove={(toIndex) => moveRow(editingRow.id, toIndex)}
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
  saving,
  publishResult,
  deleteOpen,
  onClose,
  onUpdate,
  onToggleScene,
  onToggleArtist,
  onAddTag,
  onMove,
  onSave,
  onDelete,
}: {
  row: GalleryItem
  position: number
  total: number
  artistTagOptions: string[]
  saving: boolean
  publishResult: { type: 'success' | 'error'; message: string } | null
  deleteOpen: boolean
  onClose: () => void
  onUpdate: (patch: Partial<GalleryItem>) => void
  onToggleScene: (tag: string) => void
  onToggleArtist: (tag: string) => void
  onAddTag: (tag: string) => void
  onMove: (toIndex: number) => void
  onSave: () => void
  onDelete: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const selectedArtists = galleryCustomTags(row.tags)

  useEffect(() => {
    closeRef.current?.focus()
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
      onClick={() => {
        if (!deleteOpen) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-card relative my-auto w-full max-w-5xl space-y-5 p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
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
          <GalleryPreview src={row.src} fit="contain" />
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
                placeholder="Shown under the photo in the lightbox"
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
              onAdd={onAddTag}
            />
            <div>
              <p className="font-heading mb-2 text-[10px] tracking-[0.14em] text-primary uppercase">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  ...GALLERY_SCENE_TAGS,
                  ...row.tags.filter(
                    (tag) =>
                      !(GALLERY_SCENE_TAGS as readonly string[]).includes(tag) &&
                      !GALLERY_YEAR_RE.test(tag) &&
                      !selectedArtists.includes(tag),
                  ),
                ].map((tag) => {
                  const on = row.tags.includes(tag)
                  const preset = (GALLERY_SCENE_TAGS as readonly string[]).includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggleScene(tag)}
                      className={cn(
                        chipClass,
                        preset ? 'font-heading uppercase' : '',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted hover:border-primary hover:text-primary',
                      )}
                    >
                      {tag}
                      {on && !preset ? <X size={10} aria-hidden /> : null}
                    </button>
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
              <PublishFeedback result={publishResult} saving={saving} />
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
  fit = 'cover',
  dragging = false,
}: {
  src: string
  fit?: 'cover' | 'contain'
  dragging?: boolean
}) {
  return (
    <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[1rem] border border-border bg-black">
      <img
        src={src}
        alt=""
        className={cn(
          'absolute inset-0 h-full w-full min-h-0 min-w-0 max-w-none',
          fit === 'contain' ? 'object-contain object-center' : 'object-cover object-center',
        )}
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
                className="aspect-[4/3] h-full w-full object-cover"
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
  saving,
}: {
  result: { type: 'success' | 'error'; message: string } | null
  saving: boolean
}) {
  return (
    <div className="min-h-5" aria-live="polite">
      <AnimatePresence mode="wait">
        {saving ? (
          <motion.p
            key="saving"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="font-heading text-center text-[10px] tracking-[0.12em] text-muted uppercase"
          >
            Publishing…
          </motion.p>
        ) : result ? (
          <motion.p
            key={`${result.type}-${result.message}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'font-heading flex items-center justify-center gap-1 text-center text-[10px] tracking-[0.1em] uppercase',
              result.type === 'success' ? 'text-primary' : 'text-red-400',
            )}
            role="status"
          >
            {result.type === 'success' ? (
              <CheckCircle2 size={12} aria-hidden />
            ) : (
              <AlertCircle size={12} aria-hidden />
            )}
            {result.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
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

function GalleryPager({
  page,
  pageCount,
  onPage,
  label = 'Gallery pages',
}: {
  page: number
  pageCount: number
  onPage: (page: number) => void
  label?: string
}) {
  const pages = pageWindow(page, pageCount)

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label={label}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn(
          'inline-flex h-10 items-center gap-1 border border-border px-3 text-xs tracking-[0.12em] uppercase',
          page <= 1
            ? 'cursor-not-allowed text-muted/40'
            : 'text-muted hover:border-primary hover:text-primary',
        )}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} aria-hidden />
        Prev
      </button>
      {pages.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'font-heading h-10 min-w-10 border px-3 text-xs tracking-[0.12em]',
              item === page
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className={cn(
          'inline-flex h-10 items-center gap-1 border border-border px-3 text-xs tracking-[0.12em] uppercase',
          page >= pageCount
            ? 'cursor-not-allowed text-muted/40'
            : 'text-muted hover:border-primary hover:text-primary',
        )}
        aria-label="Next page"
      >
        Next
        <ChevronRight size={14} aria-hidden />
      </button>
    </nav>
  )
}
