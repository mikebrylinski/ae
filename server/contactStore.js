import {
  BLOB_NOT_CONFIGURED,
  blobClientOptions,
  blobConfiguredFromEnv,
} from './galleryStore.js'

const CONTACT_BLOB_PATH = 'contact/submissions.json'
const MAX_STORED = 500

function blobOptions(env) {
  return blobClientOptions(env)
}

function isMissingBlob(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const msg = err instanceof Error ? err.message : String(err)
  return name === 'BlobNotFoundError' || /requested blob does not exist|blobnotfound/i.test(msg)
}

function isWriteConflict(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const msg = err instanceof Error ? err.message : String(err)
  return (
    name === 'BlobAlreadyExistsError' ||
    name === 'BlobPreconditionFailedError' ||
    /already exists|cannot be overwritten|overwrite not allowed|precondition|etag/i.test(msg)
  )
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

async function readContacts(blob, options) {
  let meta
  try {
    meta = await blob.head(CONTACT_BLOB_PATH, options)
  } catch (err) {
    if (isMissingBlob(err)) return { items: [], etag: null }
    throw err
  }

  if (!meta?.url || !meta.etag) return { items: [], etag: null }

  const response = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' })
  if (response.status === 404) return { items: [], etag: null }
  if (!response.ok) {
    throw new Error(`Could not read contact messages (${response.status})`)
  }

  const payload = JSON.parse(await response.text())
  const items = Array.isArray(payload?.items)
    ? payload.items.map(sanitizeItem).filter(Boolean)
    : []
  return { items, etag: meta.etag }
}

async function writeContacts(env, mutate) {
  const blob = await import('@vercel/blob')
  const options = blobOptions(env)

  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readContacts(blob, options)
    const items = mutate(current.items).slice(0, MAX_STORED)
    try {
      await blob.put(CONTACT_BLOB_PATH, JSON.stringify({ items }), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: Boolean(current.etag),
        contentType: 'application/json',
        cacheControlMaxAge: 0,
        ...(current.etag ? { ifMatch: current.etag } : {}),
        ...options,
      })
      return items
    } catch (err) {
      if (isWriteConflict(err) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
        continue
      }
      throw err
    }
  }

  throw new Error('Could not save contact messages')
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
    await writeContacts(env, (items) => [item, ...items.filter((row) => row.id !== item.id)])
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
    await writeContacts(env, (items) =>
      items.map((item) => (item.id === id ? { ...item, emailSent: true } : item)),
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
    let removed = false
    await writeContacts(env, (items) => {
      const next = items.filter((item) => item.id !== messageId)
      removed = next.length !== items.length
      return next
    })
    if (!removed) {
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
    const { items } = await readContacts(blob, blobOptions(env))
    const newestFirst = [...items].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
    return { ok: true, configured: true, items: newestFirst.slice(0, 200) }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Could not load messages',
      status: 502,
    }
  }
}
