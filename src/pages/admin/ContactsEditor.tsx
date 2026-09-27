import { useEffect, useMemo, useState } from 'react'
import { getAdminPassword, getSessionPassword } from '@/lib/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ContactMessage = {
  id: string
  createdAt: string
  name: string
  email: string
  subject: string
  message: string
  emailSent: boolean
}

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function ContactsEditor() {
  const [items, setItems] = useState<ContactMessage[]>([])
  const [status, setStatus] = useState('Loading messages…')
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/contacts', {
        headers: { 'X-Admin-Password': adminPassword() },
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        items?: ContactMessage[]
        error?: string
        configured?: boolean
      }
      if (!res.ok || !data.ok) {
        setItems([])
        setConfigured(data.configured !== false)
        setStatus(data.error || 'Could not load messages')
        return
      }
      setConfigured(true)
      const next = [...(data.items ?? [])].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      )
      setItems(next)
      setStatus(
        next.length
          ? `${next.length} saved ${next.length === 1 ? 'message' : 'messages'}, newest first`
          : 'No messages yet.',
      )
    } catch {
      setItems([])
      setStatus('Could not reach the contacts API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? items.filter((item) =>
          `${item.name} ${item.email} ${item.subject} ${item.message}`
            .toLowerCase()
            .includes(needle),
        )
      : items
    return [...list].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
  }, [items, query])

  async function remove(item: ContactMessage) {
    const ok = window.confirm(`Delete the message from ${item.name}?`)
    if (!ok) return
    setDeletingId(item.id)
    setStatus('')
    try {
      const res = await fetch(
        `/api/admin/contacts?id=${encodeURIComponent(item.id)}`,
        {
          method: 'DELETE',
          headers: { 'X-Admin-Password': adminPassword() },
        },
      )
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus(data.error || 'Could not delete message')
        return
      }
      setItems((current) => current.filter((row) => row.id !== item.id))
      setStatus('Message deleted.')
    } catch {
      setStatus('Could not reach the contacts API')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-white">
            Messages
          </h1>
          <p className="mt-2 text-sm text-muted">{status}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {configured ? (
        <div className="mb-6">
          <label htmlFor="contact-message-search" className="sr-only">
            Search messages
          </label>
          <Input
            id="contact-message-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, subject, or message…"
            autoComplete="off"
            className="h-11"
          />
        </div>
      ) : null}

      {!configured ? (
        <p className="border border-border p-4 text-sm leading-relaxed text-muted">
          Connect the Vercel Blob store used by the gallery (
          <span className="text-white">BLOB_READ_WRITE_TOKEN</span>). Contact
          messages are saved there and emailed to info@andyebert.com.
        </p>
      ) : null}

      {configured && query.trim() && visible.length === 0 ? (
        <p className="text-sm text-muted">No messages match that search.</p>
      ) : null}

      <ul className="space-y-4">
        {visible.map((item) => (
          <li key={item.id} className="border border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-heading text-sm tracking-[0.08em] text-white">
                {item.subject}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted">{formatWhen(item.createdAt)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  disabled={deletingId === item.id}
                  onClick={() => void remove(item)}
                >
                  {deletingId === item.id ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm text-foreground/90">
              {item.name}{' '}
              <a href={`mailto:${item.email}`} className="text-primary hover:opacity-80">
                {item.email}
              </a>
            </p>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted">
              {item.message}
            </p>
            <p className="mt-3 font-heading text-[10px] tracking-[0.14em] text-primary uppercase">
              {item.emailSent ? 'Emailed' : 'Saved only'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
