import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { nav } from '@/lib/content'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'
import { RackScrew } from '@/components/ui/Screws'
import { VeganSeal } from '@/components/ui/VeganSeal'

/** Hash links only light when the section hash matches. */
function isNavActive(
  href: string,
  pathname: string,
  hash: string,
  isActive: boolean,
) {
  if (href.includes('#')) {
    return pathname === '/' && hash === href.replace('/#', '#')
  }
  return isActive
}

function isBranchActive(item: NavItem, pathname: string, hash: string) {
  const self = isNavActive(item.href, pathname, hash, pathname === item.href)
  if (self) return true
  return (item.children ?? []).some((child) =>
    isNavActive(child.href, pathname, hash, pathname === child.href),
  )
}

function RackNavFace({
  label,
  chevron,
  expanded,
}: {
  label: string
  chevron?: boolean
  expanded?: boolean
}) {
  return (
    <span className="rack-btn__face">
      <span className="rack-btn__label inline-flex items-center gap-1">
        {label.toUpperCase()}
        {chevron ? (
          <ChevronDown
            size={11}
            strokeWidth={2.5}
            className={cn(
              'opacity-70 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        ) : null}
      </span>
    </span>
  )
}

function RackNavLed() {
  return <span className="rack-btn__led" aria-hidden />
}

function DesktopDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const location = useLocation()
  const children = item.children ?? []
  const branchActive = isBranchActive(item, location.pathname, location.hash)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        wrapRef.current
          ?.querySelector<HTMLElement>('[data-nav-trigger]')
          ?.focus()
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    <div
      ref={wrapRef}
      className={cn(
        'rack-nav__item relative',
        branchActive && 'rack-nav__item--active',
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
    >
      <RackNavLed />
      <NavLink
        to={item.href}
        data-nav-trigger
        className={cn('rack-btn', branchActive && 'rack-btn--active')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === ' ') {
            event.preventDefault()
            setOpen(true)
            requestAnimationFrame(() => {
              document
                .getElementById(menuId)
                ?.querySelector<HTMLElement>('a')
                ?.focus()
            })
          }
        }}
      >
        <RackNavFace label={item.label} chevron expanded={open} />
      </NavLink>

      <ul
        id={menuId}
        role="menu"
        aria-label={item.label}
        className={cn('rack-dropdown', open && 'rack-dropdown--open')}
        hidden={!open}
      >
        {children.map((child) => (
          <li key={child.href} role="none">
            <NavLink
              role="menuitem"
              to={child.href}
              className={({ isActive }) =>
                cn(
                  'rack-dropdown__link',
                  isNavActive(
                    child.href,
                    location.pathname,
                    location.hash,
                    isActive,
                  ) && 'rack-dropdown__link--active',
                )
              }
              onClick={() => setOpen(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                  wrapRef.current
                    ?.querySelector<HTMLElement>('[data-nav-trigger]')
                    ?.focus()
                }
              }}
            >
              {child.label.toUpperCase()}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileSubmenu({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const location = useLocation()
  const children = item.children ?? []
  const branchActive = isBranchActive(item, location.pathname, location.hash)

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-center gap-1">
        <NavLink
          to={item.href}
          onClick={onNavigate}
          className={cn(
            'font-heading py-3 text-sm tracking-[0.16em] text-white hover:text-primary',
            branchActive && 'text-primary',
          )}
        >
          {item.label.toUpperCase()}
        </NavLink>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center text-primary"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} menu`}
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown
            size={18}
            strokeWidth={1.75}
            className={cn(
              'transition-transform duration-200',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ul
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            {children.map((child) => (
              <li key={child.href}>
                <NavLink
                  to={child.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'font-heading block py-2.5 text-xs tracking-[0.16em] text-muted hover:text-primary',
                      isNavActive(
                        child.href,
                        location.pathname,
                        location.hash,
                        isActive,
                      ) && 'text-primary',
                    )
                  }
                >
                  {child.label.toUpperCase()}
                </NavLink>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  return (
    <header className="rack-header fixed inset-x-0 top-0 z-50 overflow-visible">
      <MeshBackdrop className="rack-header__mesh" />

      {/* Desktop rack faceplate + mounting ears */}
      <div className="rack-faceplate" aria-hidden>
        <div className="rack-ear rack-ear--left">
          <RackScrew angle={14} />
          <RackScrew drive="phillips" angle={-48} />
          <RackScrew angle={67} />
        </div>
        <div className="rack-ear rack-ear--right">
          <RackScrew drive="phillips" angle={22} />
          <RackScrew angle={-33} />
          <RackScrew drive="phillips" angle={81} />
        </div>
        <div className="rack-faceplate__edge" />
      </div>

      <Container className="relative z-10 flex h-20 items-center justify-between md:h-24">
        {/* Full brand block on all viewports — name above Sound Engineer, soft glow, no LED */}
        <div className="rack-brand-wrap mr-3 sm:mr-4">
          <VeganSeal />
          <Link
            to="/"
            className="rack-brand rack-brand--glow inline-flex max-w-[min(100%,14.5rem)] shrink flex-col items-center gap-0.5 text-center sm:max-w-none"
            onClick={() => setOpen(false)}
          >
            <span className="rack-brand__shine" aria-hidden />
            <span className="rack-brand__name whitespace-nowrap font-heading text-[1.35rem] tracking-[0.1em] sm:text-2xl lg:text-[1.65rem] xl:text-3xl">
              <span className="text-white">ANDY</span>{' '}
              <span className="text-primary">EBERT</span>
            </span>
            <span className="rack-brand__sub w-full font-heading text-[0.55rem] uppercase sm:text-[0.65rem] lg:text-[0.7rem]">
              Sound Engineer
            </span>
          </Link>
        </div>

        <nav
          className="rack-nav hidden items-center gap-1.5 lg:flex xl:gap-2.5"
          aria-label="Primary"
        >
          {nav.map((item) =>
            item.children?.length ? (
              <DesktopDropdown key={item.href} item={item} />
            ) : (
              <div
                key={item.href}
                className={cn(
                  'rack-nav__item',
                  isNavActive(
                    item.href,
                    location.pathname,
                    location.hash,
                    location.pathname === item.href,
                  ) && 'rack-nav__item--active',
                )}
              >
                <RackNavLed />
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rack-btn',
                      isNavActive(
                        item.href,
                        location.pathname,
                        location.hash,
                        isActive,
                      ) && 'rack-btn--active',
                    )
                  }
                >
                  <RackNavFace label={item.label} />
                </NavLink>
              </div>
            ),
          )}
        </nav>

        <button
          type="button"
          className="rack-menu-toggle inline-flex h-11 w-11 items-center justify-center text-primary lg:hidden"
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
              {nav.map((item) =>
                item.children?.length ? (
                  <MobileSubmenu
                    key={item.href}
                    item={item}
                    onNavigate={() => setOpen(false)}
                  />
                ) : (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'font-heading py-3 text-sm tracking-[0.16em] text-white hover:text-primary',
                        isNavActive(
                          item.href,
                          location.pathname,
                          location.hash,
                          isActive,
                        ) && 'text-primary',
                      )
                    }
                  >
                    {item.label.toUpperCase()}
                  </NavLink>
                ),
              )}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
