export type ContactFields = {
  name: string
  email: string
  subject: string
  message: string
}

export type ContactEnv = {
  resendApiKey: string
  toEmail: string
  fromEmail: string
}

export function parseContactBody(raw: string): ContactFields | { error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Invalid JSON' }
  }
  if (!parsed || typeof parsed !== 'object') return { error: 'Invalid body' }

  const data = parsed as Record<string, unknown>
  const name = String(data.name ?? '').trim()
  const email = String(data.email ?? '').trim()
  const subject = String(data.subject ?? '').trim()
  const message = String(data.message ?? '').trim()

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

export async function sendContactEmail(
  fields: ContactFields,
  env: ContactEnv,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  if (!env.resendApiKey) {
    return { ok: false, error: 'Email service is not configured', status: 503 }
  }

  const text = [
    `New message from the andyebert.com contact form`,
    ``,
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Subject: ${fields.subject}`,
    ``,
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

export function contactEnvFromRecord(
  env: Record<string, string | undefined>,
): ContactEnv {
  return {
    resendApiKey: (env.RESEND_API_KEY ?? '').trim(),
    toEmail: (env.CONTACT_TO_EMAIL ?? 'info@andyebert.com').trim(),
    fromEmail: (
      env.CONTACT_FROM_EMAIL ??
      'Andy Ebert Contact <onboarding@resend.dev>'
    ).trim(),
  }
}
