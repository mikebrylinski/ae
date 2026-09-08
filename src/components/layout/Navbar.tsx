import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getNav } from '@/lib/content'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { MeshBackdrop } from '@/components/ui/MeshBackdrop'
import { RackScrew } from '@/components/ui/Screws'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { interpolate } from '@/i18n/ui'
import { useLanguage } from '@/i18n/LanguageProvider'

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
  if (href !== '/' && (pathname === href || pathname.startsWith(`${href}/`))) {
    return true
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

function MobileRackItem({
  href,
  label,
  end,
  active,
  onNavigate,
  chevron,
  expanded,
}: {
  href?: string
  label: string
  end?: boolean
  active?: boolean
  onNavigate?: () => void
  chevron?: boolean
  expanded?: boolean
}) {
  const className = cn('rack-btn', active && 'rack-btn--active')
  const face = <RackNavFace label={label} chevron={chevron} expanded={expanded} />

  return (
    <div className={cn('rack-menu__item', active && 'rack-menu__item--active')}>
      <RackNavLed />
      {href ? (
        <NavLink
          to={href}
          end={end}
          onClick={onNavigate}
          className={className}
        >
          {face}
        </NavLink>
      ) : (
        <span className={className}>{face}</span>
      )}
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
  const { t } = useLanguage()
  const children = item.children ?? []
  const branchActive = isBranchActive(item, location.pathname, location.hash)

  return (
    <div className="flex w-full flex-col items-stretch">
      <div className="rack-menu__branch">
        <MobileRackItem
          href={item.href}
          label={item.label}
          active={branchActive}
          onNavigate={onNavigate}
        />
        <div className="rack-menu__expand">
          <RackNavLed />
          <button
            type="button"
            className="rack-btn"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={interpolate(
              expanded ? t.a11y.collapseMenu : t.a11y.expandMenu,
              { label: item.label },
            )}
            onClick={() => setExpanded((v) => !v)}
          >
            <RackNavFace label="" chevron expanded={expanded} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ul
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="rack-menu__children overflow-hidden"
          >
            {children.map((child) => (
              <li key={child.href}>
                <MobileRackItem
                  href={child.href}
                  label={child.label}
                  active={isNavActive(
                    child.href,
                    location.pathname,
                    location.hash,
                    location.pathname === child.href,
                  )}
                  onNavigate={onNavigate}
                />
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
  const { lang, t } = useLanguage()
  const nav = getNav(lang)
  const reduceMotion = useReducedMotion()
  const menuMotion = reduceMotion
    ? { duration: 0 }
    : { height: { duration: 0.36, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.22 } }

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.button
            key="rack-menu-overlay"
            type="button"
            className="rack-menu-overlay lg:hidden"
            aria-label={t.a11y.closeMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <header className="rack-header fixed inset-x-0 top-0 z-50 overflow-x-hidden lg:overflow-visible">
      <MeshBackdrop className="rack-header__mesh" />

      {/* Desktop rack faceplate + mounting ears */}
      <div className="rack-faceplate" aria-hidden>
        <div className="rack-ear rack-ear--left">
          <RackScrew angle={14} />
          <RackScrew angle={67} />
        </div>
        <div className="rack-ear rack-ear--right">
          <RackScrew drive="phillips" angle={22} />
          <RackScrew drive="phillips" angle={81} />
        </div>
        <div className="rack-faceplate__edge" />
      </div>

      <Container className="relative z-10 flex h-28 min-w-0 items-center justify-between gap-3 md:h-32">
        {/* Logo + language — lang sits immediately right of the brand on all viewports */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:gap-4">
          <div className="rack-brand-wrap rack-brand-wrap--no-seal rack-brand-glow min-w-0">
            <Link
              to="/"
              className="rack-brand rack-brand--glow inline-flex max-w-full min-w-0 shrink flex-col items-center gap-0.5 text-center sm:max-w-none"
              onClick={() => setOpen(false)}
            >
              <span className="rack-brand__shine" aria-hidden />
              <span className="rack-brand__name whitespace-nowrap font-heading text-[clamp(1.44rem,6vw,1.84rem)] tracking-[0.08em] sm:text-[2.16rem] sm:tracking-[0.1em] lg:text-[2.24rem] xl:text-[2.59rem]">
                <span className="text-white">ANDY</span>{' '}
                <span className="text-primary">EBERT</span>
              </span>
              <span className="rack-brand__sub w-full font-heading text-[0.71rem] uppercase sm:text-[0.83rem] lg:text-[0.9rem]">
                {t.brand.subtitle}
              </span>
            </Link>
          </div>

          <LanguageSwitch />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5">
          <nav
            className="rack-nav hidden items-center gap-1.5 lg:flex xl:gap-2.5"
            aria-label={t.a11y.primaryNav}
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
            className="rack-menu-toggle inline-flex h-11 w-11 shrink-0 items-center justify-center text-primary lg:hidden"
            aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={menuMotion}
            className="rack-menu-panel relative z-10 lg:hidden"
          >
            <nav
              className="rack-menu"
              aria-label={t.a11y.mobileNav}
            >
              <span className="metal-overlay" aria-hidden />
              <span className="rack-rivet rack-rivet--tl" aria-hidden />
              <span className="rack-rivet rack-rivet--tr" aria-hidden />
              <span className="rack-rivet rack-rivet--bl" aria-hidden />
              <span className="rack-rivet rack-rivet--br" aria-hidden />
              <div className="rack-menu__bay">
                {nav.map((item) =>
                  item.children?.length ? (
                    <MobileSubmenu
                      key={item.href}
                      item={item}
                      onNavigate={() => setOpen(false)}
                    />
                  ) : (
                    <MobileRackItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      end={item.href === '/'}
                      active={isNavActive(
                        item.href,
                        location.pathname,
                        location.hash,
                        location.pathname === item.href,
                      )}
                      onNavigate={() => setOpen(false)}
                    />
                  ),
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
    </>
  )
}
