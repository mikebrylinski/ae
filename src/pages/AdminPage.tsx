import { useMemo, useState, type FormEvent } from 'react'
import { Download, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import type { CreditEntry } from '@/types'
import {
  bundledCredits,
  clearStoredCredits,
  downloadCreditsJson,
  getAdminPassword,
  isAdminAuthed,
  isAdminConfigured,
  loadStoredCredits,
  loginAdmin,
  logoutAdmin,
  persistCreditsLocal,
  saveCreditsRemote,
  getSessionPassword,
} from '@/lib/admin'
import { isCreditFeatured } from '@/lib/content'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'

type Draft = CreditEntry & { id: string }

const ROLES = ['Monitor Engineer', 'FOH Engineer'] as const

function toDraft(credits: CreditEntry[]): Draft[] {
  return credits.map((credit, index) => ({
    ...credit,
    featured: isCreditFeatured(credit),
    id: `${credit.year}-${credit.artist}-${credit.role}-${index}`,
  }))
}

function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    year: String(new Date().getFullYear()),
    artist: '',
    region: '',
    role: 'Monitor Engineer',
    featured: true,
  }
}

function sortDrafts(rows: Draft[]): Draft[] {
  return [...rows].sort((a, b) => {
    const yearA = Number.parseInt(a.year, 10) || 0
    const yearB = Number.parseInt(b.year, 10) || 0
    if (yearB !== yearA) return yearB - yearA
    return a.artist.localeCompare(b.artist)
  })
}

export default function AdminPage() {
  useSeo({ title: 'Admin', noIndex: true })

  const [authed, setAuthed] = useState(() => isAdminAuthed())
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rows, setRows] = useState<Draft[]>(() =>
    toDraft(loadStoredCredits() ?? bundledCredits()),
  )
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [add, setAdd] = useState<Draft>(emptyDraft)

  const configured = isAdminConfigured()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? rows.filter((row) =>
          `${row.year} ${row.artist} ${row.region} ${row.role}`.toLowerCase().includes(q),
        )
      : rows
    return sortDrafts(list)
  }, [rows, query])

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!configured) {
      setLoginError('Set VITE_ADMIN_PASSWORD in .env.local, then restart the dev server.')
      return
    }
    if (loginAdmin(password)) {
      setAuthed(true)
      setLoginError('')
      setPassword('')
    } else {
      setLoginError('Wrong password.')
    }
  }

  function handleLogout() {
    logoutAdmin()
    setAuthed(false)
  }

  function updateRow(id: string, patch: Partial<Draft>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    if (!window.confirm(`Delete ${row.artist} (${row.year})?`)) return
    setRows((current) => current.filter((item) => item.id !== id))
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!add.artist.trim() || !add.year.trim()) {
      setStatus('Year and artist are required.')
      return
    }
    setRows((current) => [
      {
        ...add,
        id: crypto.randomUUID(),
        artist: add.artist.trim(),
        year: add.year.trim(),
        region: add.region.trim(),
      },
      ...current,
    ])
    setAdd(emptyDraft())
    setStatus('Credit added — click Save to keep it.')
  }

  async function handleSave() {
    setSaving(true)
    const credits: CreditEntry[] = rows.map(({ year, artist, region, role, featured }) => ({
      year,
      artist,
      region,
      role,
      featured,
    }))
    persistCreditsLocal(credits)
    const remote = await saveCreditsRemote(credits, getSessionPassword() || getAdminPassword())
    setSaving(false)
    if (remote.file) {
      setStatus('Saved to experience.json and this browser.')
    } else {
      setStatus(
        'Saved in this browser. Use JSON to download the file for the live site, or keep the dev server running to write the file automatically.',
      )
    }
  }

  function handleDownload() {
    downloadCreditsJson(rows)
    setStatus('Downloaded experience.json')
  }

  function handleReset() {
    if (!window.confirm('Reset to the original site file and discard browser edits?')) return
    clearStoredCredits()
    setRows(toDraft(bundledCredits()))
    setStatus('Reset to the bundled experience list.')
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-5">
        <form
          onSubmit={handleLogin}
          className="glass-card w-full max-w-md space-y-5 p-8"
        >
          <p className="font-heading text-xs tracking-[0.2em] text-primary">Admin</p>
          <h1 className="font-heading text-3xl tracking-[0.08em] text-white">
            Career Credits
          </h1>
          <p className="text-sm text-muted">
            Sign in to add, edit, or remove year-by-year credits.
          </p>
          <div>
            <label htmlFor="admin-password" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {loginError ? <p className="text-sm text-red-400">{loginError}</p> : null}
          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-border bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12 xl:px-14">
          <div>
            <p className="font-heading text-[0.65rem] tracking-[0.2em] text-primary">Admin</p>
            <h1 className="font-heading text-lg tracking-[0.08em]">Experience list</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className="font-heading inline-flex h-10 items-center px-5 text-xs tracking-[0.08em] uppercase text-muted hover:text-primary"
            >
              Site
            </a>
            <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
              <Save size={14} aria-hidden />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
              <Download size={14} aria-hidden />
              JSON
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut size={14} aria-hidden />
              Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
        {status ? <p className="text-sm text-primary">{status}</p> : null}

        <form onSubmit={handleAdd} className="glass-card grid gap-3 p-5 md:grid-cols-[7rem_1fr_1fr_12rem_auto_auto]">
          <Input
            value={add.year}
            onChange={(e) => setAdd((c) => ({ ...c, year: e.target.value }))}
            placeholder="Year"
            aria-label="Year"
          />
          <Input
            value={add.artist}
            onChange={(e) => setAdd((c) => ({ ...c, artist: e.target.value }))}
            placeholder="Artist"
            aria-label="Artist"
          />
          <Input
            value={add.region}
            onChange={(e) => setAdd((c) => ({ ...c, region: e.target.value }))}
            placeholder="Region"
            aria-label="Region"
          />
          <select
            value={add.role}
            onChange={(e) => setAdd((c) => ({ ...c, role: e.target.value }))}
            aria-label="Role"
            className="h-12 border border-border bg-surface px-3 text-sm"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={Boolean(add.featured)}
              onChange={(e) => setAdd((c) => ({ ...c, featured: e.target.checked }))}
            />
            On site
          </label>
          <Button type="submit" size="sm">
            <Plus size={14} aria-hidden />
            Add
          </Button>
        </form>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-muted">{rows.length} credits</p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist, year, region…"
            className="max-w-sm"
            aria-label="Search credits"
          />
        </div>

        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="font-heading text-[0.65rem] tracking-[0.16em] text-primary">
              <tr className="border-b border-border">
                <th className="px-3 py-3">Year</th>
                <th className="px-3 py-3">Artist</th>
                <th className="px-3 py-3">Region</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">On site</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-2 py-2">
                    <Input
                      value={row.year}
                      onChange={(e) => updateRow(row.id, { year: e.target.value })}
                      className="h-10"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={row.artist}
                      onChange={(e) => updateRow(row.id, { artist: e.target.value })}
                      className="h-10"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={row.region}
                      onChange={(e) => updateRow(row.id, { region: e.target.value })}
                      className="h-10"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={row.role}
                      onChange={(e) => updateRow(row.id, { role: e.target.value })}
                      className="h-10 w-full border border-border bg-surface px-3 text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      {!ROLES.includes(row.role as (typeof ROLES)[number]) ? (
                        <option value={row.role}>{row.role}</option>
                      ) : null}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(row.featured)}
                      onChange={(e) => updateRow(row.id, { featured: e.target.checked })}
                      aria-label={`Show ${row.artist} on Career Credits`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className={cn('p-2 text-muted hover:text-primary')}
                      aria-label={`Delete ${row.artist}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
