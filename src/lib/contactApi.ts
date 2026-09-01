/** Shared contact form payload helpers (browser + server). */

export type ContactPayload = {
  name: string
  email: string
  subject: string
  message: string
}

export function normalizeContactPayload(input: unknown): ContactPayload | null {
  if (!input || typeof input !== 'object') return null
  const data = input as Record<string, unknown>
  const name = String(data.name ?? '').trim()
  const email = String(data.email ?? '').trim()
  const subject = String(data.subject ?? '').trim()
  const message = String(data.message ?? '').trim()

  if (!name || !email || !subject || !message) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  if (name.length > 200 || email.length > 320 || subject.length > 300) return null
  if (message.length > 10_000) return null

  return { name, email, subject, message }
}

export async function submitContactForm(
  payload: ContactPayload,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      message?: string
    }
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        message: data.error || data.message || 'Could not send message',
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Could not reach the contact service' }
  }
}
