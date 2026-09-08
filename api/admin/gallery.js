import {
  BLOB_NOT_CONFIGURED,
  blobConfiguredFromEnv,
  decodeImageData,
  isAdminAuthorized,
  parseGalleryPutBody,
  parseGalleryUploadBody,
  uploadImageToBlob,
  writeGalleryToBlob,
} from '../../server/galleryStore.js'

function env() {
  return globalThis.process?.env ?? {}
}

function rawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (req.body == null) return ''
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')
  return JSON.stringify(req.body)
}

function authorize(req) {
  const given = String(req.headers['x-admin-password'] ?? '')
  return isAdminAuthorized(given, env())
}

/**
 * Production: PUT /api/admin/gallery (metadata)
 *             POST /api/admin/gallery (image upload → Vercel Blob)
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', 'PUT, POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!authorize(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const runtimeEnv = env()
  if (!blobConfiguredFromEnv(runtimeEnv)) {
    return res.status(503).json({
      ok: false,
      error: BLOB_NOT_CONFIGURED,
    })
  }

  try {
    if (req.method === 'PUT') {
      const parsed = parseGalleryPutBody(rawBody(req))
      if ('error' in parsed) {
        return res.status(400).json({ ok: false, error: parsed.error })
      }
      await writeGalleryToBlob(parsed.items, runtimeEnv)
      return res.status(200).json({ ok: true, file: true, blob: true })
    }

    const parsed = parseGalleryUploadBody(rawBody(req))
    if ('error' in parsed) {
      return res.status(400).json({ ok: false, error: parsed.error })
    }
    const buffer = decodeImageData(parsed.data)
    const uploaded = await uploadImageToBlob({
      buffer,
      contentType: parsed.contentType,
      filename: parsed.filename,
      env: runtimeEnv,
    })
    return res.status(200).json({
      ok: true,
      src: uploaded.src,
      width: parsed.width,
      height: parsed.height,
      file: true,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    })
  }
}
