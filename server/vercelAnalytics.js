const API = 'https://api.vercel.com/v1/query/web-analytics/visits'
const RANGES = {
  '24h': { hours: 24, by: 'hour', limit: 48 },
  '7d': { days: 7, by: 'day', limit: 100 },
  '30d': { days: 30, by: 'day', limit: 100 },
}
const CACHE_MS = 30_000
const PANEL_LIMIT = 10

const cache = new Map()
const inflight = new Map()

function credentials(env) {
  const token = (
    env.VERCEL_ACCESS_TOKEN?.trim() ||
    env.VERCEL_ANALYTICS_TOKEN?.trim() ||
    ''
  )
  const projectId = (
    env.VERCEL_ANALYTICS_PROJECT_ID?.trim() ||
    env.VERCEL_PROJECT_ID?.trim() ||
    ''
  )
  const teamId = (
    env.VERCEL_ANALYTICS_TEAM_ID?.trim() ||
    env.VERCEL_TEAM_ID?.trim() ||
    env.VERCEL_ORG_ID?.trim() ||
    ''
  )
  return { token, projectId, teamId }
}

export function analyticsConfigured(env) {
  const { token, projectId } = credentials(env)
  return Boolean(token && projectId)
}

export function normalizeAnalyticsRange(value) {
  return Object.hasOwn(RANGES, value) ? value : '7d'
}

function rangeWindow(range) {
  const config = RANGES[range] ?? RANGES['7d']
  const until = new Date()
  const since = new Date(until)

  if (config.hours) {
    since.setTime(until.getTime() - config.hours * 60 * 60 * 1000)
  } else {
    since.setUTCHours(0, 0, 0, 0)
    since.setUTCDate(since.getUTCDate() - (config.days - 1))
    // Exclusive until at next UTC midnight. End-of-day timestamps get truncated to 00:00.
    until.setUTCHours(0, 0, 0, 0)
    until.setUTCDate(until.getUTCDate() + 1)
  }

  return {
    since: since.toISOString(),
    until: until.toISOString(),
    by: config.by,
    seriesLimit: config.limit,
    range: Object.hasOwn(RANGES, range) ? range : '7d',
  }
}

function errorMessage(body, status) {
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string' && body.error) return body.error
    if (body.error && typeof body.error.message === 'string' && body.error.message) {
      return body.error.message
    }
    if (typeof body.message === 'string' && body.message) return body.message
  }
  if (status === 401 || status === 403) {
    return 'The Vercel token cannot read Web Analytics for this project.'
  }
  if (status === 402) {
    return 'This date range is outside the Web Analytics window for the current Vercel plan.'
  }
  return `Vercel Analytics returned ${status}`
}

async function query(env, path, params) {
  const { token, projectId, teamId } = credentials(env)
  const url = new URL(`${API}/${path}`)
  url.searchParams.set('projectId', projectId)
  if (teamId) url.searchParams.set('teamId', teamId)
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  let response
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12_000),
    })
  } catch (err) {
    const name = err && typeof err === 'object' ? err.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      const timeout = new Error('Vercel Analytics took too long to respond.')
      timeout.status = 504
      throw timeout
    }
    const failed = new Error('Could not reach Vercel Analytics.')
    failed.status = 502
    throw failed
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const failed = new Error(errorMessage(body, response.status))
    failed.status = response.status
    throw failed
  }
  return body
}

function metrics(row) {
  const pageviews = Number(row?.pageviews ?? row?.count ?? 0)
  const visitors = Number(row?.visitors ?? 0)
  return {
    pageviews: Number.isFinite(pageviews) ? pageviews : 0,
    visitors: Number.isFinite(visitors) ? visitors : 0,
  }
}

function bucketKey(timestamp, by) {
  if (typeof timestamp !== 'string' || !timestamp) return ''
  if (by === 'hour') return timestamp.slice(0, 13)
  return timestamp.slice(0, 10)
}

function fillSeries(rows, sinceIso, untilIso, by) {
  const byBucket = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = bucketKey(row?.timestamp, by)
    if (!key) continue
    byBucket.set(key, metrics(row))
  }

  const series = []
  const cursor = new Date(sinceIso)
  const end = new Date(untilIso)
  if (by === 'hour') {
    cursor.setUTCMinutes(0, 0, 0)
    end.setUTCMinutes(0, 0, 0)
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 13)
      const hit = byBucket.get(key) ?? { pageviews: 0, visitors: 0 }
      series.push({ date: `${key}:00:00.000Z`, ...hit })
      cursor.setUTCHours(cursor.getUTCHours() + 1)
    }
    return series
  }

  cursor.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(0, 0, 0, 0)
  // Keep the inclusive calendar day that contains `untilIso`.
  // If the API returns an exclusive midnight boundary, step back one day.
  if (
    end.getTime() > cursor.getTime() &&
    new Date(untilIso).getUTCHours() === 0 &&
    new Date(untilIso).getUTCMinutes() === 0 &&
    new Date(untilIso).getUTCSeconds() === 0 &&
    new Date(untilIso).getUTCMilliseconds() === 0
  ) {
    end.setUTCDate(end.getUTCDate() - 1)
  }
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10)
    const hit = byBucket.get(date) ?? { pageviews: 0, visitors: 0 }
    series.push({ date, ...hit })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return series
}

function breakdown(rows, key, emptyLabel = '') {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const raw = row?.[key]
      const label = raw == null ? '' : String(raw).trim()
      return { label: label || emptyLabel, ...metrics(row) }
    })
    .filter((row) => row.label.length > 0)
    // Match the Vercel Visitors tab: panels ranked by visitors.
    .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews)
}

function notConfigured() {
  return {
    ok: false,
    configured: false,
    status: 200,
    error:
      'Set VERCEL_ACCESS_TOKEN for this project. On Vercel, VERCEL_PROJECT_ID is already available. For local preview, also set VERCEL_PROJECT_ID and VERCEL_TEAM_ID in .env.local.',
  }
}

async function fetchReport(env, range) {
  if (!analyticsConfigured(env)) return notConfigured()

  const window = rangeWindow(range)
  try {
    const [totals, series, pages, countries, referrers, devices, browsers, os] =
      await Promise.all([
        query(env, 'count', { since: window.since, until: window.until }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: window.by,
          limit: window.seriesLimit,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'requestPath',
          limit: PANEL_LIMIT,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'country',
          limit: PANEL_LIMIT,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'referrerHostname',
          limit: PANEL_LIMIT,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'deviceType',
          limit: PANEL_LIMIT,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'browserName',
          limit: PANEL_LIMIT,
        }),
        query(env, 'aggregate', {
          since: window.since,
          until: window.until,
          by: 'osName',
          limit: PANEL_LIMIT,
        }),
      ])

    return {
      ok: true,
      configured: true,
      range: window.range,
      granularity: window.by,
      since: window.since,
      until: window.until,
      totals: metrics(totals?.data),
      series: fillSeries(series?.data, window.since, window.until, window.by),
      pages: breakdown(pages?.data, 'requestPath'),
      countries: breakdown(countries?.data, 'country'),
      referrers: breakdown(referrers?.data, 'referrerHostname', 'Direct').map((row) => ({
        ...row,
        label: row.label.toLowerCase() === 'direct' ? 'Direct' : row.label,
      })),
      devices: breakdown(devices?.data, 'deviceType'),
      browsers: breakdown(browsers?.data, 'browserName'),
      os: breakdown(os?.data, 'osName'),
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      status: err?.status || 502,
      error: err instanceof Error ? err.message : 'Could not load analytics',
    }
  }
}

export async function loadAdminAnalytics(env, rangeInput, options = {}) {
  const range = normalizeAnalyticsRange(rangeInput)
  if (!analyticsConfigured(env)) return notConfigured()

  const { projectId, teamId } = credentials(env)
  const key = `${projectId}|${teamId}|${range}`
  const hit = cache.get(key)
  if (!options.fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.payload

  const pending = inflight.get(key)
  if (pending) return pending

  const job = fetchReport(env, range)
    .then((payload) => {
      if (payload.ok) cache.set(key, { at: Date.now(), payload })
      return payload
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, job)
  return job
}

const BUCKET_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}(?::\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?(?:Z)?)?$/

export function bucketWindow(bucket, granularity = 'day') {
  const raw = String(bucket ?? '').trim()
  if (!BUCKET_RE.test(raw)) return null

  if (granularity === 'hour' || raw.includes('T')) {
    const start = new Date(raw.includes('T') ? raw : `${raw}T00:00:00.000Z`)
    if (Number.isNaN(start.getTime())) return null
    start.setUTCMinutes(0, 0, 0)
    // Exclusive end: Vercel count truncates sub-hour timestamps and needs the next hour.
    const end = new Date(start)
    end.setUTCHours(end.getUTCHours() + 1)
    return {
      since: start.toISOString(),
      until: end.toISOString(),
      granularity: 'hour',
      label: start.toISOString(),
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const start = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  // Exclusive end at next midnight. End-of-day timestamps get truncated to 00:00 and return 0.
  return {
    since: start.toISOString(),
    until: end.toISOString(),
    granularity: 'day',
    label: raw,
  }
}

async function fetchBucketDetail(env, window) {
  const detailLimit = 8
  try {
    const [totals, pages, countries, referrers, devices, browsers, os] = await Promise.all([
      query(env, 'count', { since: window.since, until: window.until }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'requestPath',
        limit: detailLimit,
      }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'country',
        limit: detailLimit,
      }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'referrerHostname',
        limit: detailLimit,
      }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'deviceType',
        limit: detailLimit,
      }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'browserName',
        limit: detailLimit,
      }),
      query(env, 'aggregate', {
        since: window.since,
        until: window.until,
        by: 'osName',
        limit: detailLimit,
      }),
    ])

    return {
      ok: true,
      configured: true,
      detail: true,
      granularity: window.granularity,
      since: window.since,
      until: window.until,
      totals: metrics(totals?.data),
      pages: breakdown(pages?.data, 'requestPath'),
      countries: breakdown(countries?.data, 'country'),
      referrers: breakdown(referrers?.data, 'referrerHostname', 'Direct').map((row) => ({
        ...row,
        label: row.label.toLowerCase() === 'direct' ? 'Direct' : row.label,
      })),
      devices: breakdown(devices?.data, 'deviceType'),
      browsers: breakdown(browsers?.data, 'browserName'),
      os: breakdown(os?.data, 'osName'),
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      status: err?.status || 502,
      error: err instanceof Error ? err.message : 'Could not load analytics detail',
    }
  }
}

export async function loadAnalyticsBucketDetail(env, bucket, granularity = 'day') {
  if (!analyticsConfigured(env)) return notConfigured()

  const window = bucketWindow(bucket, granularity)
  if (!window) {
    return {
      ok: false,
      configured: true,
      status: 400,
      error: 'Invalid analytics bucket',
    }
  }

  const { projectId, teamId } = credentials(env)
  const key = `detail|${projectId}|${teamId}|${window.since}|${window.until}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.payload

  const pending = inflight.get(key)
  if (pending) return pending

  const job = fetchBucketDetail(env, window)
    .then((payload) => {
      if (payload.ok) cache.set(key, { at: Date.now(), payload })
      return payload
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, job)
  return job
}
