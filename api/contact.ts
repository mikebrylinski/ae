import {
  contactEnvFromRecord,
  parseContactBody,
  sendContactEmail,
} from '../server/sendContactEmail.ts'

type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

/**
 * Production: POST /api/contact
 * Sends the contact form to CONTACT_TO_EMAIL (default info@andyebert.com) via Resend.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const raw =
    typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  const fields = parseContactBody(raw)
  if ('error' in fields) {
    return res.status(400).json({ ok: false, error: fields.error })
  }

  const env = contactEnvFromRecord(process.env as Record<string, string | undefined>)
  const result = await sendContactEmail(fields, env)
  if (!result.ok) {
    return res.status(result.status ?? 500).json({ ok: false, error: result.error })
  }

  return res.status(200).json({ ok: true })
}
