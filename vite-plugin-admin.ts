import fs from 'node:fs'
import path from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      if (chunks.reduce((n, c) => n + c.length, 0) > 2_000_000) {
        reject(new Error('Payload too large'))
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** Dev-only: PUT /api/admin/credits writes src/data/experience.json */
export function adminApiPlugin(rootDir: string): Plugin {
  return {
    name: 'ae-admin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/admin/credits' || req.method !== 'PUT') {
          next()
          return
        }

        const env = loadEnv(server.config.mode, rootDir, '')
        const expected =
          env.VITE_ADMIN_PASSWORD?.trim() ||
          env.ADMIN_PASSWORD?.trim() ||
          process.env.VITE_ADMIN_PASSWORD?.trim() ||
          process.env.ADMIN_PASSWORD?.trim() ||
          ''
        const given = String(req.headers['x-admin-password'] ?? '')
        if (!expected || given !== expected) {
          json(res, 401, { ok: false, error: 'Unauthorized' })
          return
        }

        try {
          const raw = await readBody(req)
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
        } catch (err) {
          json(res, 500, {
            ok: false,
            error: err instanceof Error ? err.message : 'Save failed',
          })
        }
      })
    },
  }
}
