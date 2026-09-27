import fs from 'node:fs'
import path from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'
import {
  deleteContactSubmission,
  listContactSubmissions,
} from './server/contactStore.js'
import {
  blobConfiguredFromEnv,
  decodeImageData,
  isAdminAuthorized,
  MAX_GALLERY_JSON_BYTES,
  MAX_GALLERY_UPLOAD_BYTES,
  mergeArtistOrderMap,
  parseArtistOrderPutBody,
  parseGalleryPutBody,
  parseGalleryUploadBody,
  readArtistOrderFromBlob,
  readGalleryFromBlob,
  sanitizeArtistOrder,
  sanitizeGalleryItems,
  writeArtistOrderToBlob,
  writeGalleryToBlob,
} from './server/galleryStore.js'

function readBody(
  req: import('node:http').IncomingMessage,
  maxBytes: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      if (chunks.reduce((n, c) => n + c.length, 0) > maxBytes) {
        reject(new Error('Payload too large'))
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(
  res: import('node:http').ServerResponse,
  status: number,
  body: unknown,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function envRecord(
  server: ViteDevServer,
  rootDir: string,
): Record<string, string | undefined> {
  const loaded = loadEnv(server.config.mode, rootDir, '')
  return { ...process.env, ...loaded }
}

function authorize(
  req: import('node:http').IncomingMessage,
  env: Record<string, string | undefined>,
): boolean {
  const given = String(req.headers['x-admin-password'] ?? '')
  return isAdminAuthorized(given, env)
}

function galleryJsonPath(rootDir: string) {
  return path.resolve(rootDir, 'src/data/gallery.json')
}

function artistOrderJsonPath(rootDir: string) {
  return path.resolve(rootDir, 'src/data/artist-order.json')
}

function readLocalGallery(rootDir: string): unknown[] {
  const file = galleryJsonPath(rootDir)
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
  return Array.isArray(parsed) ? parsed : []
}

function readLocalArtistOrder(rootDir: string): Record<string, number[]> {
  const file = artistOrderJsonPath(rootDir)
  if (!fs.existsSync(file)) return {}
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const data = parsed as { order?: unknown }
      return sanitizeArtistOrder(data.order ?? parsed)
    }
  } catch {
    return {}
  }
  return {}
}

function writeLocalArtistOrder(rootDir: string, order: Record<string, number[]>) {
  fs.writeFileSync(
    artistOrderJsonPath(rootDir),
    `${JSON.stringify({ order, updatedAt: Date.now() }, null, 2)}\n`,
  )
}

function publicBlobHost(items: unknown[]): string | null {
  for (const item of items) {
    if (!item || typeof item !== 'object' || !('src' in item)) continue
    const src = String((item as { src?: unknown }).src ?? '')
    const match = src.match(/^(https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com)\//i)
    if (match) return match[1]
  }
  return null
}

const LIVE_GALLERY_API = 'https://ae-eight-omega.vercel.app/api/gallery'

type LiveGallery = {
  items: NonNullable<ReturnType<typeof sanitizeGalleryItems>>
  artistOrder: Record<string, number[]>
}

/** Gallery payload the public site is serving right now. */
async function readDeploymentGallery(url: string): Promise<LiveGallery | null> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const payload = (await res.json()) as { items?: unknown; artistOrder?: unknown }
  const items = sanitizeGalleryItems(payload.items)
  if (!items?.length) return null
  return { items, artistOrder: sanitizeArtistOrder(payload.artistOrder) }
}

/** Same gallery the live site serves, when this machine has no Blob token. */
async function readPublicDeployedGallery(host: string): Promise<LiveGallery | null> {
  const [galleryRes, orderRes] = await Promise.all([
    fetch(`${host}/gallery/index.json`, { cache: 'no-store' }),
    fetch(`${host}/gallery/artist-order.json`, { cache: 'no-store' }),
  ])
  if (!galleryRes.ok) return null
  const payload = (await galleryRes.json()) as { items?: unknown }
  const items = sanitizeGalleryItems(payload.items ?? payload)
  if (!items?.length) return null

  let artistOrder: Record<string, number[]> = {}
  if (orderRes.ok) {
    const orderPayload = (await orderRes.json()) as { order?: unknown }
    artistOrder = sanitizeArtistOrder(orderPayload.order ?? orderPayload)
  }
  return { items, artistOrder }
}

function extensionForType(contentType: string) {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

function safeStem(name: string) {
  const base = name.replace(/\.[^.]+$/, '')
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return (cleaned || 'photo').slice(0, 60)
}

/** Dev: credits + gallery admin APIs, plus public GET /api/gallery */
export function adminApiPlugin(rootDir: string): Plugin {
  return {
    name: 'ae-admin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        try {
          if (url === '/api/admin/contacts' && (req.method === 'GET' || req.method === 'DELETE')) {
            const env = envRecord(server, rootDir)
            if (!authorize(req, env)) {
              json(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }
            if (req.method === 'DELETE') {
              const id = new URL(req.url ?? '', 'http://localhost').searchParams.get('id') ?? ''
              const deleted = await deleteContactSubmission(id, env)
              if (!deleted.ok) {
                json(res, deleted.status ?? 500, {
                  ok: false,
                  configured: deleted.configured,
                  error: deleted.error,
                })
                return
              }
              json(res, 200, { ok: true })
              return
            }
            const result = await listContactSubmissions(env)
            if (!result.ok) {
              json(res, result.status ?? 500, {
                ok: false,
                configured: result.configured,
                error: result.error,
              })
              return
            }
            json(res, 200, { ok: true, items: result.items })
            return
          }

          if (url === '/api/gallery' && req.method === 'GET') {
            const env = envRecord(server, rootDir)
            const localItems = sanitizeGalleryItems(readLocalGallery(rootDir)) ?? []

            if (blobConfiguredFromEnv(env)) {
              const [items, artistOrder] = await Promise.all([
                readGalleryFromBlob(env),
                readArtistOrderFromBlob(env),
              ])
              if (items?.length) {
                json(res, 200, { ok: true, items, artistOrder, blob: true })
                return
              }
            }

            const host = publicBlobHost(localItems)
            for (const load of [
              () => readDeploymentGallery(LIVE_GALLERY_API),
              () => (host ? readPublicDeployedGallery(host) : Promise.resolve(null)),
            ]) {
              try {
                const live = await load()
                if (live) {
                  json(res, 200, {
                    ok: true,
                    items: live.items,
                    artistOrder: live.artistOrder,
                    blob: true,
                  })
                  return
                }
              } catch {
                // Try the next live source, then the bundled gallery.
              }
            }

            json(res, 200, {
              ok: true,
              items: localItems,
              artistOrder: readLocalArtistOrder(rootDir),
            })
            return
          }

          if (url === '/api/admin/credits' && req.method === 'PUT') {
            const env = envRecord(server, rootDir)
            if (!authorize(req, env)) {
              json(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            const raw = await readBody(req, MAX_GALLERY_JSON_BYTES)
            const payload = JSON.parse(raw) as { credits?: unknown }
            if (!Array.isArray(payload.credits)) {
              json(res, 400, { ok: false, error: 'credits array required' })
              return
            }

            const file = path.resolve(rootDir, 'src/data/experience.json')
            const current = JSON.parse(fs.readFileSync(file, 'utf8')) as {
              credits?: unknown
            }
            current.credits = payload.credits
            fs.writeFileSync(file, `${JSON.stringify(current, null, 2)}\n`)
            json(res, 200, { ok: true, file: true })
            return
          }

          if (url === '/api/admin/gallery' && req.method === 'PUT') {
            const env = envRecord(server, rootDir)
            if (!authorize(req, env)) {
              json(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            const raw = await readBody(req, MAX_GALLERY_JSON_BYTES)
            let payload: { items?: unknown; slug?: unknown; artistOrder?: unknown }
            try {
              payload = JSON.parse(raw) as {
                items?: unknown
                slug?: unknown
                artistOrder?: unknown
              }
            } catch {
              json(res, 400, { ok: false, error: 'Invalid JSON' })
              return
            }

            if (
              !Array.isArray(payload.items) &&
              (payload.slug != null || payload.artistOrder != null)
            ) {
              const parsed = parseArtistOrderPutBody(raw)
              if ('error' in parsed) {
                json(res, 400, { ok: false, error: parsed.error })
                return
              }
              const current = readLocalArtistOrder(rootDir)
              const next =
                'slug' in parsed
                  ? mergeArtistOrderMap(current, parsed.slug, parsed.ids)
                  : parsed.artistOrder
              writeLocalArtistOrder(rootDir, next)
              const blob = blobConfiguredFromEnv(env)
              if (blob) {
                await writeArtistOrderToBlob(next, env)
              }
              json(res, 200, { ok: true, file: true, blob, artistOrder: true })
              return
            }

            const parsed = parseGalleryPutBody(raw)
            if ('error' in parsed) {
              json(res, 400, { ok: false, error: parsed.error })
              return
            }

            fs.writeFileSync(
              galleryJsonPath(rootDir),
              `${JSON.stringify(parsed.items, null, 2)}\n`,
            )
            const blob = blobConfiguredFromEnv(env)
            if (blob) {
              await writeGalleryToBlob(parsed.items, env)
            }
            json(res, 200, { ok: true, file: true, blob })
            return
          }

          if (url === '/api/admin/gallery' && req.method === 'POST') {
            const env = envRecord(server, rootDir)
            if (!authorize(req, env)) {
              json(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            const raw = await readBody(req, MAX_GALLERY_UPLOAD_BYTES)
            const parsed = parseGalleryUploadBody(raw)
            if ('error' in parsed) {
              json(res, 400, { ok: false, error: parsed.error })
              return
            }

            const buffer = decodeImageData(parsed.data)
            const ext = extensionForType(parsed.contentType)
            const stem = parsed.id
              ? `gallery-${parsed.id}`
              : `${Date.now()}-${safeStem(parsed.filename)}`
            const dir = path.resolve(rootDir, 'public/images/gallery')
            fs.mkdirSync(dir, { recursive: true })
            const filename = `${stem}.${ext}`
            fs.writeFileSync(path.join(dir, filename), buffer)
            json(res, 200, {
              ok: true,
              src: `/images/gallery/${filename}`,
              width: parsed.width,
              height: parsed.height,
              file: true,
            })
            return
          }
        } catch (err) {
          json(res, 500, {
            ok: false,
            error: err instanceof Error ? err.message : 'Save failed',
          })
          return
        }

        next()
      })
    },
  }
}
