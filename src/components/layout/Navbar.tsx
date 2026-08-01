import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { nav } from '@/lib/content'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="fixed inset-x-0 top-0 z-50 overflow-hidden border-b border-white/5 bg-black/80 backdrop-blur-md">
      <MeshBackdrop />

      <Container className="relative z-10 flex h-16 items-center justify-between md:h-20">
        <Link
          to="/"
          className="font-heading text-xl tracking-[0.12em] sm:text-2xl"
          onClick={() => setOpen(false)}
        >
          <span className="text-white">ANDY</span>{' '}
          <span className="text-primary">EBERT</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'font-heading text-xs tracking-[0.16em] text-white transition-colors hover:text-primary',
                  (isActive ||
                    (item.href.includes('#') &&
                      location.pathname === '/' &&
                      location.hash === item.href.replace('/#', '#'))) &&
                    'text-primary',
                )
              }
            >
              {item.label.toUpperCase()}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center text-primary lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 border-t border-border bg-black/90 lg:hidden"
          >
            <nav
              className="flex flex-col items-center gap-1 px-5 py-6 text-center"
              aria-label="Mobile"
            >
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="font-heading py-3 text-sm tracking-[0.16em] text-white hover:text-primary"
                >
                  {item.label.toUpperCase()}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
