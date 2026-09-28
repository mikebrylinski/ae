import {
  BLOB_NOT_CONFIGURED,
  blobClientOptions,
  blobConfiguredFromEnv,
} from './galleryStore.js'

const LEGACY_BLOB_PATH = 'contact/submissions.json'
const MESSAGE_PREFIX = 'contact/messages/'
const MAX_STORED = 500

function blobOptions(env) {
  return blobClientOptions(env)
}

function messagePath(id) {
  return `${MESSAGE_PREFIX}${id}.json`
}

function isMissingBlob(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const msg = err instanceof Error ? err.message : String(err)
  return name === 'BlobNotFoundError' || /requested blob does not exist|blobnotfound/i.test(msg)
}

function sanitizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id ?? '').trim()
  const name = String(raw.name ?? '').trim()
  const email = String(raw.email ?? '').trim()
  const subject = String(raw.subject ?? '').trim()
  const message = String(raw.message ?? '')
  const createdAt = String(raw.createdAt ?? '').trim()
  if (!id || !name || !email || !subject || !createdAt) return null
  return {
    id,
    createdAt,
    name,
    email,
    subject,
    message,
    emailSent: Boolean(raw.emailSent),
  }
}

function putOptions(options, allowOverwrite) {
  return {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    ...options,
  }
}

async function readJson(blob, pathname, options) {
  try {
    const result = await blob.get(pathname, {
      access: 'public',
      useCache: false,
      ...options,
    })
    if (!result?.stream) return null
    return JSON.parse(await new Response(result.stream).text())
  } catch (err) {
    if (isMissingBlob(err)) return null
    throw err
  }
}

async function readLegacyItems(blob, options) {
  const payload = await readJson(blob, LEGACY_BLOB_PATH, options)
  return Array.isArray(payload?.items)
    ? payload.items.map(sanitizeItem).filter(Boolean)
    : []
}

async function listMessageEntries(blob, options) {
  const entries = []
  let cursor
  do {
    const page = await blob.list({
      prefix: MESSAGE_PREFIX,
      limit: 1000,
      cursor,
      ...options,
    })
    entries.push(...(page.blobs ?? []))
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return entries
}

async function readMessageEntries(blob, options) {
  const entries = await listMessageEntries(blob, options)
  const items = await Promise.all(
    entries.map(async (entry) => {
      const payload = await readJson(blob, entry.pathname, options)
      return sanitizeItem(payload)
    }),
  )
  return items.filter(Boolean)
}

/** Older submissions lived in one file. A follow-up write of that file dropped new mail. */
async function promoteLegacyItems(blob, options, current) {
  const legacy = await readLegacyItems(blob, options)
  const known = new Set(current.map((item) => item.id))
  const promoted = []
  for (const item of legacy) {
    if (known.has(item.id)) continue
    try {
      await blob.put(messagePath(item.id), JSON.stringify(item), putOptions(options, false))
      promoted.push(item)
      known.add(item.id)
    } catch (err) {
      if (!isMissingBlob(err) && !/already exists|cannot be overwritten/i.test(String(err?.message))) {
        console.error('Could not copy a stored contact message', err)
      }
    }
  }
  return promoted
}

function newestFirst(items) {
  return [...items]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_STORED)
}

export async function saveContactSubmission(fields, env) {
  if (!blobConfiguredFromEnv(env)) {
    return { ok: false, configured: false, error: BLOB_NOT_CONFIGURED, status: 503 }
  }

  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: fields.name,
    email: fields.email,
    subject: fields.subject,
    message: fields.message,
    emailSent: false,
  }

  try {
    const blob = await import('@vercel/blob')
    const options = blobOptions(env)
    await blob.put(messagePath(item.id), JSON.stringify(item), putOptions(options, false))
    return { ok: true, configured: true, id: item.id }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Could not save message',
      status: 502,
    }
  }
}

export async function markContactEmailSent(id, env) {
  if (!id || !blobConfiguredFromEnv(env)) return
  try {
    const blob = await import('@vercel/blob')
    const options = blobOptions(env)
    const payload = await readJson(blob, messagePath(id), options)
    const item = sanitizeItem(payload)
    if (!item) return
    await blob.put(
      messagePath(id),
      JSON.stringify({ ...item, emailSent: true }),
      putOptions(options, true),
    )
  } catch (err) {
    console.error('Could not mark contact email as sent', err)
  }
}

export async function deleteContactSubmission(id, env) {
  if (!blobConfiguredFromEnv(env)) {
    return { ok: false, configured: false, error: BLOB_NOT_CONFIGURED, status: 503 }
  }

  const messageId = String(id ?? '').trim()
  if (!messageId) {
    return { ok: false, configured: true, error: 'Message id is required', status: 400 }
  }

  try {
    const blob = await import('@vercel/blob')
    const options = blobOptions(env)
    const pathname = messagePath(messageId)
    let existed = false
    try {
      await blob.head(pathname, options)
      existed = true
    } catch (err) {
      if (!isMissingBlob(err)) throw err
    }
    if (existed) await blob.del(pathname, options)

    const legacy = await readLegacyItems(blob, options)
    if (legacy.some((item) => item.id === messageId)) {
      const next = legacy.filter((item) => item.id !== messageId)
      await blob.put(
        LEGACY_BLOB_PATH,
        JSON.stringify({ items: next }),
        putOptions(options, true),
      )
      existed = true
    }

    if (!existed) {
      return { ok: false, configured: true, error: 'Message not found', status: 404 }
    }
    return { ok: true, configured: true }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Could not delete message',
      status: 502,
    }
  }
}

export async function listContactSubmissions(env) {
  if (!blobConfiguredFromEnv(env)) {
    return { ok: false, configured: false, error: BLOB_NOT_CONFIGURED, status: 503 }
  }

  try {
    const blob = await import('@vercel/blob')
    const options = blobOptions(env)
    const stored = await readMessageEntries(blob, options)
    const promoted = await promoteLegacyItems(blob, options, stored)
    return {
      ok: true,
      configured: true,
      items: newestFirst([...promoted, ...stored]),
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Could not load messages',
      status: 502,
    }
  }
}
