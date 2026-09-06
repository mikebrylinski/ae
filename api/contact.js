function parseContactBody(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON' }
  }
  if (!parsed || typeof parsed !== 'object') return { error: 'Invalid body' }

  const name = String(parsed.name ?? '').trim()
  const email = String(parsed.email ?? '').trim()
  const subject = String(parsed.subject ?? '').trim()
  const message = String(parsed.message ?? '').trim()

  if (!name || !email || !subject || !message) {
    return { error: 'Name, email, subject, and message are required' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Valid email is required' }
  }
  if (name.length > 200 || email.length > 320 || subject.length > 300) {
    return { error: 'Field too long' }
  }
  if (message.length > 10_000) {
    return { error: 'Message too long' }
  }

  return { name, email, subject, message }
}

function contactEnv() {
  const env = globalThis.process?.env ?? {}
  return {
    resendApiKey: (env.RESEND_API_KEY ?? '').trim(),
    toEmail: (env.CONTACT_TO_EMAIL ?? 'info@andyebert.com').trim(),
    fromEmail: (
      env.CONTACT_FROM_EMAIL ??
      'Andy Ebert Contact <onboarding@resend.dev>'
    ).trim(),
  }
}

async function sendContactEmail(fields, env) {
  if (!env.resendApiKey) {
    return { ok: false, error: 'Email service is not configured', status: 503 }
  }

  const text = [
    'New message from the andyebert.com contact form',
    '',
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Subject: ${fields.subject}`,
    '',
    fields.message,
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.fromEmail,
      to: [env.toEmail],
      reply_to: fields.email,
      subject: `[Website] ${fields.subject}`,
      text,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return {
      ok: false,
      error: detail || 'Email provider rejected the message',
      status: 502,
    }
  }

  return { ok: true }
}

/**
 * Production: POST /api/contact
 * Sends the contact form to CONTACT_TO_EMAIL (default info@andyebert.com) via Resend.
 */
export default async function handler(req, res) {
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

  const result = await sendContactEmail(fields, contactEnv())
  if (result.ok) {
    return res.status(200).json({ ok: true })
  }

  return res.status(result.status ?? 500).json({ ok: false, error: result.error })
}
