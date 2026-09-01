import { loadEnv, type Plugin, type ViteDevServer } from 'vite'
import {
  contactEnvFromRecord,
  parseContactBody,
  sendContactEmail,
} from './server/sendContactEmail.ts'

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      if (chunks.reduce((n, c) => n + c.length, 0) > 100_000) {
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

/** Dev: POST /api/contact → Resend → info@andyebert.com */
export function contactApiPlugin(rootDir: string): Plugin {
  return {
    name: 'ae-contact-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/contact' || req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          const fields = parseContactBody(raw)
          if ('error' in fields) {
            json(res, 400, { ok: false, error: fields.error })
            return
          }

          const loaded = loadEnv(server.config.mode, rootDir, '')
          const env = contactEnvFromRecord({
            ...process.env,
            ...loaded,
          })

          const result = await sendContactEmail(fields, env)
          if (!result.ok) {
            json(res, result.status ?? 500, { ok: false, error: result.error })
            return
          }

          json(res, 200, { ok: true })
        } catch (err) {
          json(res, 500, {
            ok: false,
            error: err instanceof Error ? err.message : 'Send failed',
          })
        }
      })
    },
  }
}
