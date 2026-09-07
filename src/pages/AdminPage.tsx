import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogOut } from 'lucide-react'
import {
  isAdminAuthed,
  isAdminConfigured,
  loginAdmin,
  logoutAdmin,
} from '@/lib/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSeo } from '@/hooks/useSeo'
import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'
import { CreditsEditor } from '@/pages/admin/CreditsEditor'
import { GalleryEditor } from '@/pages/admin/GalleryEditor'
import { Footer, AllAccessLaminate } from '@/components/layout/Footer'

type Tab = 'credits' | 'gallery'

export default function AdminPage() {
  useSeo({ title: 'Admin', noIndex: true })
  const { t } = useLanguage()

  const [authed, setAuthed] = useState(() => isAdminAuthed())
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('gallery')

  const configured = isAdminConfigured()

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

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <div className="flex flex-1 items-center justify-center px-5">
        <form
          onSubmit={handleLogin}
          className="glass-card w-full max-w-md space-y-5 p-8"
        >
          <p className="font-heading text-xs tracking-[0.2em] text-primary">Admin</p>
          <h1 className="font-heading text-3xl tracking-[0.08em] text-white">
            Sign in
          </h1>
          <p className="text-sm text-muted">
            Edit career credits and gallery photos, tags, and captions.
          </p>
          <div>
            <label htmlFor="admin-password" className="font-heading mb-2 block text-xs tracking-[0.14em] text-primary">
              Password
            </label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          </div>
          {loginError ? <p className="text-sm text-red-400">{loginError}</p> : null}
          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
        </div>
        <Footer admin />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="admin-header sticky top-0 z-20 border-b border-border bg-black/90 pb-2 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12 xl:px-14">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="rack-brand-wrap rack-brand-wrap--no-seal rack-brand-glow min-w-0">
              <Link
                to="/"
                className="rack-brand rack-brand--glow inline-flex max-w-full min-w-0 shrink flex-col items-center gap-0.5 text-center sm:max-w-none"
              >
                <span className="rack-brand__shine" aria-hidden />
                <span className="rack-brand__name whitespace-nowrap font-heading text-[clamp(1.28rem,4.5vw,1.7rem)] tracking-[0.08em] sm:text-[1.85rem] sm:tracking-[0.1em]">
                  <span className="text-white">ANDY</span>{' '}
                  <span className="text-primary">EBERT</span>
                </span>
                <span className="rack-brand__sub w-full font-heading text-[0.65rem] uppercase sm:text-[0.75rem]">
                  {t.brand.subtitle}
                </span>
                <span className="font-heading mt-0.5 text-[0.62rem] tracking-[0.22em] text-primary uppercase sm:text-[0.7rem]">
                  Admin Area
                </span>
              </Link>
            </div>
            <AllAccessLaminate />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <nav
              className="rack-nav flex items-center gap-1.5 xl:gap-2.5"
              aria-label="Admin sections"
            >
              <AdminTab
                label="Gallery"
                active={tab === 'gallery'}
                onClick={() => setTab('gallery')}
              />
              <AdminTab
                label="Credits"
                active={tab === 'credits'}
                onClick={() => setTab('credits')}
              />
            </nav>
            <Button type="button" size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut size={14} aria-hidden />
              Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {tab === 'gallery' ? <GalleryEditor /> : <CreditsEditor />}
      </div>
      <Footer admin />
    </div>
  )
}

function AdminTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div className={cn('rack-nav__item', active && 'rack-nav__item--active')}>
      <span className="rack-btn__led" aria-hidden />
      <button
        type="button"
        className={cn('rack-btn', active && 'rack-btn--active')}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
      >
        <span className="rack-btn__face">
          <span className="rack-btn__label">{label.toUpperCase()}</span>
        </span>
      </button>
    </div>
  )
}
