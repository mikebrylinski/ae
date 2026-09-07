import fs from 'node:fs'
import path from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'
import {
  decodeImageData,
  isAdminAuthorized,
  MAX_GALLERY_JSON_BYTES,
  MAX_GALLERY_UPLOAD_BYTES,
  parseGalleryPutBody,
  parseGalleryUploadBody,
  sanitizeGalleryItems,
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

function readLocalGallery(rootDir: string): unknown[] {
  const file = galleryJsonPath(rootDir)
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
  return Array.isArray(parsed) ? parsed : []
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
          if (url === '/api/gallery' && req.method === 'GET') {
            json(res, 200, {
              ok: true,
              items: sanitizeGalleryItems(readLocalGallery(rootDir)) ?? [],
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
            const parsed = parseGalleryPutBody(raw)
            if ('error' in parsed) {
              json(res, 400, { ok: false, error: parsed.error })
              return
            }

            fs.writeFileSync(
              galleryJsonPath(rootDir),
              `${JSON.stringify(parsed.items, null, 2)}\n`,
            )
            json(res, 200, { ok: true, file: true })
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
