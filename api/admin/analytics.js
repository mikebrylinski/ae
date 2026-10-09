import { isAdminAuthorized } from '../../server/galleryStore.js'
import {
  loadAdminAnalytics,
  loadAnalyticsBucketDetail,
  normalizeAnalyticsRange,
} from '../../server/vercelAnalytics.js'

function env() {
  return globalThis.process?.env ?? {}
}

/**
 * Production: GET /api/admin/analytics?range=24h|7d|30d
 *             GET /api/admin/analytics?bucket=YYYY-MM-DD&granularity=day|hour
 * Reads Vercel Web Analytics for this project. Requires VERCEL_ACCESS_TOKEN.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const given = String(req.headers['x-admin-password'] ?? '')
  if (!isAdminAuthorized(given, env())) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')

  const bucket = typeof req.query?.bucket === 'string' ? req.query.bucket : ''
  if (bucket) {
    const granularity =
      req.query?.granularity === 'hour' || bucket.includes('T') ? 'hour' : 'day'
    const result = await loadAnalyticsBucketDetail(env(), bucket, granularity)
    if (!result.ok) {
      const status = result.configured === false ? 200 : (result.status ?? 502)
      return res.status(status).json({
        ok: false,
        configured: result.configured,
        error: result.error,
      })
    }
    return res.status(200).json(result)
  }

  const range = normalizeAnalyticsRange(
    typeof req.query?.range === 'string' ? req.query.range : '7d',
  )
  const fresh = req.query?.fresh === '1'
  const result = await loadAdminAnalytics(env(), range, { fresh })
  if (!result.ok) {
    const status = result.configured === false ? 200 : (result.status ?? 502)
    return res.status(status).json({
      ok: false,
      configured: result.configured,
      error: result.error,
    })
  }

  return res.status(200).json(result)
}
