import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  GripVertical,
  Save,
} from 'lucide-react'
import type { GalleryItem } from '@/types'
import {
  bundledGallery,
  fetchRemoteGalleryPayload,
  saveArtistOrderRemote,
  type ArtistGalleryOrderMap,
} from '@/lib/galleryAdmin'
import { getAdminPassword, getSessionPassword } from '@/lib/admin'
import {
  projects,
  resolveProjectGallerySources,
  type ProjectGallerySource,
} from '@/lib/content'
import {
  GALLERY_TILE_ASPECT_CLASS,
  galleryTilePositionStyle,
} from '@/lib/galleryFocal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
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
  const [publishError, setPublishError] = useState('')
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

  const rowsRef = useRef(rows)
  const dragIdRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointRef = useRef<{ x: number; y: number } | null>(null)
  const draftsRef = useRef<Record<string, number[]>>({})
  const publishedRef = useRef<Record<string, string>>({})

  rowsRef.current = rows

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
    setStatus('Order updated — click Publish to site.')
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
    setPublishError('')
    const remote = await saveArtistOrderRemote(project.slug, ids, adminPassword())
    setSaving(false)
    setPublishFlash((current) => current + 1)
    if (!remote.ok) {
      setPublishError(remote.message || 'Publish failed. Try again.')
      return
    }
    publishedRef.current[project.slug] = idsKey(ids)
    draftsRef.current[project.slug] = ids
    setArtistOrder((current) => ({ ...current, [project.slug]: ids }))
    setStatus(`Published ${project.artist} page order. /gallery is unchanged.`)
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
        <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
          Artist page galleries
        </p>
        <p className="text-sm leading-relaxed text-muted">
          This is separate from the main Gallery page. Order here only affects this artist’s
          portfolio page.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Upload every photo in the <span className="text-white">Gallery</span> tab first, then tag
          it with this artist. Only tagged photos show up here to reorder. New tagged photos land
          at the end until you drag them.
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
              setPublishError('')
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
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            {rows.length} photo{rows.length === 1 ? '' : 's'}
            {dirty ? ' · unpublished changes' : ''}
          </p>
          <div className="ml-auto flex min-w-[11rem] flex-col items-stretch gap-1">
            <motion.div
              key={publishFlash}
              initial={false}
              animate={publishError ? { x: [0, -6, 6, -4, 4, 0] } : { scale: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => void handleSave()}
                disabled={saving || !project || rows.length === 0}
              >
                <Save size={14} aria-hidden />
                {saving ? 'Publishing…' : 'Publish to site'}
              </Button>
            </motion.div>
            {publishError ? (
              <p className="text-[11px] text-red-400">{publishError}</p>
            ) : null}
          </div>
        </div>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No photos yet. Upload them on the Gallery tab and tag them with this artist, then come
          back here to set the page order.
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
    </div>
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
