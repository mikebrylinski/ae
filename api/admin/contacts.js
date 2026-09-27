import { isAdminAuthorized } from '../../server/galleryStore.js'
import {
  deleteContactSubmission,
  listContactSubmissions,
} from '../../server/contactStore.js'

function env() {
  return globalThis.process?.env ?? {}
}

/**
 * Production: GET /api/admin/contacts
 *             DELETE /api/admin/contacts?id=
 * Lists and deletes contact form submissions stored in Vercel Blob.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const given = String(req.headers['x-admin-password'] ?? '')
  if (!isAdminAuthorized(given, env())) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query?.id === 'string' ? req.query.id : ''
    const deleted = await deleteContactSubmission(id, env())
    if (!deleted.ok) {
      return res.status(deleted.status ?? 500).json({
        ok: false,
        configured: deleted.configured,
        error: deleted.error,
      })
    }
    return res.status(200).json({ ok: true })
  }

  const result = await listContactSubmissions(env())
  if (!result.ok) {
    return res.status(result.status ?? 500).json({
      ok: false,
      configured: result.configured,
      error: result.error,
    })
  }

  return res.status(200).json({ ok: true, items: result.items })
}
