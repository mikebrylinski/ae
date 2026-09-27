export type ContactSubmission = {
  id: string
  createdAt: string
  name: string
  email: string
  subject: string
  message: string
  emailSent: boolean
}

export function saveContactSubmission(
  fields: { name: string; email: string; subject: string; message: string },
  env: Record<string, string | undefined>,
): Promise<
  | { ok: true; configured: true; id: string }
  | { ok: false; configured: boolean; error: string; status?: number }
>

export function markContactEmailSent(
  id: string,
  env: Record<string, string | undefined>,
): Promise<void>

export function deleteContactSubmission(
  id: string,
  env: Record<string, string | undefined>,
): Promise<
  | { ok: true; configured: true }
  | { ok: false; configured: boolean; error: string; status?: number }
>

export function listContactSubmissions(
  env: Record<string, string | undefined>,
): Promise<
  | { ok: true; configured: true; items: ContactSubmission[] }
  | { ok: false; configured: boolean; error: string; status?: number }
>
