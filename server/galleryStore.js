import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const GALLERY_BLOB_PATH = 'gallery/index.json'
export const ARTIST_ORDER_BLOB_PATH = 'gallery/artist-order.json'
export const GALLERY_BACKUP_LATEST = 'gallery/backups/latest.json'
export const GALLERY_BACKUP_PRESERVED = 'gallery/backups/preserved.json'
export const ARTIST_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_GALLERY_JSON_BYTES = 2_000_000
export const MAX_GALLERY_UPLOAD_BYTES = 4_500_000
export const MAX_DECODED_IMAGE_BYTES = 3_500_000

export function adminPasswordFromEnv(env) {
  return (
    env.ADMIN_PASSWORD?.trim() ||
    env.VITE_ADMIN_PASSWORD?.trim() ||
    ''
  )
}

export function isAdminAuthorized(given, env) {
  const expected = adminPasswordFromEnv(env)
  return Boolean(expected && given === expected)
}

export const BLOB_NOT_CONFIGURED =
  'Vercel Blob is not connected. In the Vercel project open Storage → Create Database → Blob (Public), connect it to this project for Production, then redeploy.'

export function blobTokenFromEnv(env) {
  return (env.BLOB_READ_WRITE_TOKEN ?? '').trim()
}

/** True when a Blob store is linked (OIDC) or a static write token is set. */
export function blobConfiguredFromEnv(env) {
  return Boolean(blobTokenFromEnv(env) || (env.BLOB_STORE_ID ?? '').trim())
}

function blobClientOptions(env) {
  const token = blobTokenFromEnv(env)
  return token ? { token } : {}
}

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function parseGalleryId(value) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export function nextGalleryId(items) {
  let max = 0
  for (const item of items) {
    const id = parseGalleryId(item?.id)
    if (id && id > max) max = id
  }
  return max + 1
}

export function sanitizeGalleryItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw
  const src = asTrimmedString(data.src)
  const alt = asTrimmedString(data.alt)
  if (!src || !alt) return null

  const tags = Array.isArray(data.tags)
    ? data.tags.map((tag) => asTrimmedString(tag)).filter(Boolean).slice(0, 24)
    : []
  const category = asTrimmedString(data.category) || tags[0] || 'Tour'
  const caption = asTrimmedString(data.caption)
  const yearNum = Number(data.year)
  const width = Math.max(1, Math.round(Number(data.width) || 1))
  const height = Math.max(1, Math.round(Number(data.height) || 1))
  const id = parseGalleryId(data.id)

  const item = {
    id: id ?? 0,
    src: src.slice(0, 2000),
    alt: alt.slice(0, 300),
    category: category.slice(0, 80),
    tags,
    width,
    height,
  }

  if (Number.isFinite(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
    item.year = Math.round(yearNum)
  }
  if (caption) item.caption = caption.slice(0, 240)
  if (data.teaser === true) item.teaser = true

  const hasFocal = data.focalX != null || data.focalY != null
  if (hasFocal) {
    const focalX = Number(data.focalX)
    const focalY = Number(data.focalY)
    const x = Number.isFinite(focalX)
      ? Math.min(100, Math.max(0, Math.round(focalX * 10) / 10))
      : 50
    const y = Number.isFinite(focalY)
      ? Math.min(100, Math.max(0, Math.round(focalY * 10) / 10))
      : 50
    if (x !== 50 || y !== 50) {
      item.focalX = x
      item.focalY = y
    }
  }

  return item
}

export function sanitizeGalleryItems(raw) {
  if (!Array.isArray(raw)) return null
  const prepared = []
  for (const entry of raw) {
    const item = sanitizeGalleryItem(entry)
    if (item) prepared.push(item)
  }

  const used = new Set()
  for (const item of prepared) {
    if (item.id >= 1 && !used.has(item.id)) used.add(item.id)
  }

  let next = 1
  const items = []
  for (const item of prepared) {
    let id = item.id
    if (id < 1 || items.some((row) => row.id === id)) {
      while (used.has(next)) next += 1
      id = next
      used.add(id)
      next += 1
    }
    items.push({ ...item, id })
  }
  return items
}

function sanitizeArtistIdList(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const ids = []
  for (const value of raw) {
    const id = parseGalleryId(value)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= 400) break
  }
  return ids
}

export function sanitizeArtistOrder(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [slug, ids] of Object.entries(raw)) {
    const key = asTrimmedString(slug).toLowerCase()
    if (!ARTIST_SLUG_RE.test(key) || key.length > 80) continue
    const list = sanitizeArtistIdList(ids)
    if (list.length) out[key] = list
  }
  return out
}

export function parseArtistOrderPutBody(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON' }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'Invalid body' }
  }
  if (Array.isArray(parsed.items)) {
    return { error: 'items PUT is not an artist-order save' }
  }

  const slug = asTrimmedString(parsed.slug).toLowerCase()
  if (slug && Array.isArray(parsed.ids)) {
    if (!ARTIST_SLUG_RE.test(slug) || slug.length > 80) {
      return { error: 'Invalid slug' }
    }
    return { slug, ids: sanitizeArtistIdList(parsed.ids) }
  }

  if (parsed.artistOrder && typeof parsed.artistOrder === 'object') {
    return { artistOrder: sanitizeArtistOrder(parsed.artistOrder) }
  }

  return { error: 'slug and ids required' }
}

export function mergeArtistOrderMap(current, slug, ids) {
  const next = { ...sanitizeArtistOrder(current) }
  if (!ids.length) delete next[slug]
  else next[slug] = ids
  return next
}

export function parseGalleryPutBody(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON' }
  }
  if (!parsed || typeof parsed !== 'object') return { error: 'Invalid body' }
  const items = sanitizeGalleryItems(parsed.items)
  if (!items) return { error: 'items array required' }
  return { items }
}

function stripDataUrl(data) {
  const value = asTrimmedString(data)
  const comma = value.indexOf(',')
  if (value.startsWith('data:') && comma >= 0) return value.slice(comma + 1)
  return value
}

export function parseGalleryUploadBody(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON' }
  }
  if (!parsed || typeof parsed !== 'object') return { error: 'Invalid body' }

  const data = stripDataUrl(parsed.data)
  if (!data) return { error: 'Image data is required' }

  const contentType = asTrimmedString(parsed.contentType) || 'image/jpeg'
  if (!/^image\/(jpeg|png|webp)$/.test(contentType)) {
    return { error: 'Only JPEG, PNG, or WebP uploads are allowed' }
  }

  const width = Math.max(1, Math.round(Number(parsed.width) || 1))
  const height = Math.max(1, Math.round(Number(parsed.height) || 1))
  const filename = asTrimmedString(parsed.filename) || 'photo.jpg'
  const id = parseGalleryId(parsed.id)

  return {
    ...(id ? { id } : {}),
    filename: filename.slice(0, 120),
    contentType,
    data,
    width,
    height,
  }
}

export function loadBundledGalleryItems() {
  try {
    const data = require('../src/data/gallery.json')
    return sanitizeGalleryItems(data)
  } catch {
    return null
  }
}

export function decodeImageData(data) {
  const buffer = Buffer.from(data, 'base64')
  if (!buffer.length) throw new Error('Empty image data')
  if (buffer.length > MAX_DECODED_IMAGE_BYTES) {
    throw new Error('Image is too large')
  }
  return buffer
}

export async function readGalleryFromBlob(env) {
  const blob = await import('@vercel/blob')
  const auth = blobClientOptions(env)
  try {
    const meta = await blob.head(GALLERY_BLOB_PATH, auth)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return null
    const payload = await res.json()
    return sanitizeGalleryItems(payload.items ?? payload)
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
    if (name === 'BlobNotFoundError') return null
    throw err
  }
}

function galleryBackupBody(items, note) {
  return `${JSON.stringify(
    {
      items,
      savedAt: Date.now(),
      ...(note ? { note } : {}),
    },
    null,
    2,
  )}\n`
}

function isBlobAlreadyExistsError(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const msg = err instanceof Error ? err.message : String(err)
  return (
    name === 'BlobAlreadyExistsError' ||
    /already exists|cannot be overwritten|overwrite not allowed|conflict/i.test(msg)
  )
}

export async function writeGalleryBackupToBlob(items, env, note) {
  if (!items?.length) return
  const { put } = await import('@vercel/blob')
  await put(
    GALLERY_BACKUP_LATEST,
    galleryBackupBody(items, note),
    {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      ...blobClientOptions(env),
    },
  )
}

/** Writes a one-time frozen copy. Does not overwrite if it already exists. */
export async function ensurePreservedGalleryBackup(items, env) {
  if (!items?.length) return { skipped: true }
  const blob = await import('@vercel/blob')
  const auth = blobClientOptions(env)
  try {
    await blob.head(GALLERY_BACKUP_PRESERVED, auth)
    return { wrote: false, exists: true }
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
    if (name !== 'BlobNotFoundError') throw err
  }

  try {
    const preserved = await blob.put(
      GALLERY_BACKUP_PRESERVED,
      galleryBackupBody(items, 'Frozen snapshot of the working gallery order'),
      {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
        ...auth,
      },
    )
    return { wrote: true, preservedUrl: preserved.url }
  } catch (err) {
    if (isBlobAlreadyExistsError(err)) return { wrote: false, exists: true }
    throw err
  }
}

export async function readArtistOrderFromBlob(env) {
  const blob = await import('@vercel/blob')
  const auth = blobClientOptions(env)
  try {
    const meta = await blob.head(ARTIST_ORDER_BLOB_PATH, auth)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return {}
    const payload = await res.json()
    return sanitizeArtistOrder(payload.order ?? payload)
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
    if (name === 'BlobNotFoundError') return {}
    throw err
  }
}

export async function writeArtistOrderToBlob(order, env) {
  const { put } = await import('@vercel/blob')
  const sanitized = sanitizeArtistOrder(order)
  await put(
    ARTIST_ORDER_BLOB_PATH,
    `${JSON.stringify({ order: sanitized, updatedAt: Date.now() }, null, 2)}\n`,
    {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      ...blobClientOptions(env),
    },
  )
}

export async function writeArtistOrderSlugToBlob(slug, ids, env) {
  const current = await readArtistOrderFromBlob(env)
  const next = mergeArtistOrderMap(current, slug, ids)
  await writeArtistOrderToBlob(next, env)
  return next
}

export async function writeGalleryToBlob(items, env) {
  const previous = await readGalleryFromBlob(env)
  if (previous?.length) {
    await ensurePreservedGalleryBackup(previous, env)
    await writeGalleryBackupToBlob(previous, env, 'Previous live gallery before publish')
  }
  const { put } = await import('@vercel/blob')
  await put(
    GALLERY_BLOB_PATH,
    `${JSON.stringify({ items, updatedAt: Date.now() }, null, 2)}\n`,
    {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      ...blobClientOptions(env),
    },
  )
}

function safeFilename(name) {
  const base = name.replace(/\.[^.]+$/, '')
  const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return (cleaned || 'photo').slice(0, 60)
}

export async function uploadImageToBlob({ buffer, contentType, filename, env }) {
  const { put } = await import('@vercel/blob')
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const blob = await put(
    `gallery/photos/${Date.now()}-${safeFilename(filename)}.${ext}`,
    buffer,
    {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      ...blobClientOptions(env),
    },
  )
  return { src: blob.url }
}
