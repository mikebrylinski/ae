import type { CreditEntry, ExperienceData } from '@/types'
import experienceData from '@/data/experience.json'

const experience = experienceData as ExperienceData

export const ADMIN_SESSION_KEY = 'ae-admin-session'
const ADMIN_PW_KEY = 'ae-admin-pw'
export const CREDITS_STORAGE_KEY = 'ae-credits-v1'
export const CREDITS_UPDATED_EVENT = 'ae-credits-updated'

export function getAdminPassword(): string {
  return (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() ?? ''
}

export function isAdminConfigured(): boolean {
  return getAdminPassword().length > 0
}

export function isAdminAuthed(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function loginAdmin(password: string): boolean {
  const expected = getAdminPassword()
  if (!expected || password !== expected) return false
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
  sessionStorage.setItem(ADMIN_PW_KEY, password)
  return true
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
  sessionStorage.removeItem(ADMIN_PW_KEY)
}

export function getSessionPassword(): string {
  try {
    return sessionStorage.getItem(ADMIN_PW_KEY) ?? ''
  } catch {
    return ''
  }
}

export function bundledCredits(): CreditEntry[] {
  return structuredClone(experience.credits ?? [])
}

export function persistCreditsLocal(credits: CreditEntry[]) {
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify({ credits }))
  window.dispatchEvent(new Event(CREDITS_UPDATED_EVENT))
}

function withPortfolioCreditFixes(credits: CreditEntry[]): CreditEntry[] {
  let sawFeaturedAlanis = false
  return credits.map((credit) => {
    let next = credit
    if (credit.artist === 'Usher' && /one\s*offs?/i.test(credit.region)) {
      next = { ...next, region: 'MTV Music Awards' }
    }
    if (credit.artist === 'Alanis Morissette') {
      if (!sawFeaturedAlanis) {
        sawFeaturedAlanis = true
        next = {
          ...next,
          year: '2012–Present',
          region: 'Worldwide',
          featured: true,
        }
      } else {
        next = { ...next, featured: false }
      }
    }
    return next
  })
}

export function loadStoredCredits(): CreditEntry[] | null {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { credits?: CreditEntry[] }
    if (!Array.isArray(parsed.credits)) return null
    return withPortfolioCreditFixes(parsed.credits)
  } catch {
    return null
  }
}

export function clearStoredCredits() {
  localStorage.removeItem(CREDITS_STORAGE_KEY)
  window.dispatchEvent(new Event(CREDITS_UPDATED_EVENT))
}

export function creditsForJson(credits: CreditEntry[]): CreditEntry[] {
  return credits.map(({ year, artist, region, role, featured }) => {
    const entry: CreditEntry = { year, artist, region, role }
    if (typeof featured === 'boolean') entry.featured = featured
    return entry
  })
}

export async function saveCreditsRemote(
  credits: CreditEntry[],
  password: string,
): Promise<{ ok: boolean; file?: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/credits', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ credits: creditsForJson(credits) }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, message: text || res.statusText }
    }
    const data = (await res.json()) as { ok?: boolean; file?: boolean }
    return { ok: true, file: Boolean(data.file) }
  } catch {
    return { ok: false, message: 'Could not reach save API' }
  }
}

export function downloadCreditsJson(credits: CreditEntry[]) {
  const payload = {
    ...experience,
    credits: creditsForJson(credits),
  }
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'experience.json'
  a.click()
  URL.revokeObjectURL(url)
}
