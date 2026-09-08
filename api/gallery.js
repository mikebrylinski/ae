import {
  blobConfiguredFromEnv,
  ensurePreservedGalleryBackup,
  loadBundledGalleryItems,
  readGalleryFromBlob,
} from '../server/galleryStore.js'

function env() {
  return globalThis.process?.env ?? {}
}

/**
 * Production: GET /api/gallery
 * Returns live gallery metadata from Vercel Blob, or items: null to use the bundled JSON.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')

  const runtimeEnv = env()
  if (!blobConfiguredFromEnv(runtimeEnv)) {
    return res.status(200).json({ ok: true, items: null })
  }

  try {
    const items = await readGalleryFromBlob(runtimeEnv)
    const snapshot = items?.length ? items : loadBundledGalleryItems()
    let backup = null
    if (snapshot?.length) {
      try {
        backup = await ensurePreservedGalleryBackup(snapshot, runtimeEnv)
      } catch (err) {
        backup = { error: err instanceof Error ? err.message : 'backup failed' }
      }
    }
    const reportBackup = String(req.url || '').includes('backup=1')
    return res.status(200).json(
      reportBackup ? { ok: true, items, backup } : { ok: true, items },
    )
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load gallery',
    })
  }
}
