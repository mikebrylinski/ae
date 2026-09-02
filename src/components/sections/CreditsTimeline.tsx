import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import {
  getPortfolioCredits,
  type CreditRoleFilter,
} from '@/lib/content'
import { CREDITS_UPDATED_EVENT } from '@/lib/admin'
import { getLenis } from '@/hooks/useLenis'
import { Badge } from '@/components/ui/Badge'
import { VuPlate } from '@/components/ui/VuPlate'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { GroupedCredit } from '@/types'

const ROLE_FILTERS: { id: CreditRoleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'monitors', label: 'Monitors' },
  { id: 'foh', label: 'FOH' },
]

const PAGE_SIZE = 10

export const CAREER_CREDITS_SECTION_ID = 'career-credits'

function roleBadgeLabel(role: string): string {
  if (role === 'FOH Engineer') return 'FOH'
  if (role === 'Monitor Engineer') return 'Monitors'
  return role
}

function scrollCreditsSectionIntoView(reduced: boolean) {
  const el = document.getElementById(CAREER_CREDITS_SECTION_ID)
  if (!el) return

  const header = document.querySelector<HTMLElement>('.rack-header')
  const headerH = header?.getBoundingClientRect().height ?? 0
  const lenis = getLenis()
  const current = lenis ? lenis.scroll : window.scrollY
  const top = Math.max(0, el.getBoundingClientRect().top + current - headerH - 8)

  if (lenis) {
    lenis.scrollTo(top, { immediate: reduced })
  } else {
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }
}

function CreditsPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  label,
  variant = 'bar',
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  label: string
  /** `bar` = full-width bottom nav; `rail` = compact horizontal rail on the right */
  variant?: 'bar' | 'rail'
}) {
  const isRail = variant === 'rail'

  return (
    <nav
      className={cn(
        'flex flex-nowrap items-center',
        isRail
          ? 'justify-end gap-1'
          : 'justify-between gap-2 sm:gap-4',
        className,
      )}
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className={cn(
          'font-heading shrink-0 border uppercase transition-colors',
          isRail
            ? 'px-1.5 py-1 text-[9px] tracking-[0.08em]'
            : 'px-2.5 py-2 text-[10px] tracking-[0.1em] sm:px-4 sm:text-xs sm:tracking-[0.14em]',
          currentPage <= 1
            ? 'cursor-not-allowed border-border text-muted/40'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        )}
      >
        {isRail ? (
          'Prev'
        ) : (
          <>
            <span className="sm:hidden">Prev</span>
            <span className="hidden sm:inline">Previous</span>
          </>
        )}
      </button>

      <div
        className={cn(
          'flex min-w-0 flex-nowrap items-center',
          isRail ? 'gap-0.5' : 'justify-center gap-1 sm:gap-2',
        )}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
            className={cn(
              'font-heading flex shrink-0 items-center justify-center border tracking-[0.08em] transition-colors',
              isRail
                ? 'h-6 w-6 text-[9px]'
                : 'h-7 w-7 text-[10px] sm:h-9 sm:w-9 sm:text-xs',
              pageNum === currentPage
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted hover:border-primary hover:text-primary',
            )}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className={cn(
          'font-heading shrink-0 border uppercase transition-colors',
          isRail
            ? 'px-1.5 py-1 text-[9px] tracking-[0.08em]'
            : 'px-2.5 py-2 text-[10px] tracking-[0.1em] sm:px-4 sm:text-xs sm:tracking-[0.14em]',
          currentPage >= totalPages
            ? 'cursor-not-allowed border-border text-muted/40'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        )}
      >
        Next
      </button>
    </nav>
  )
}

function CreditCard({
  credit,
  className,
  /** Flip image toward the center rail on desktop right-side entries */
  mirror = false,
}: {
  credit: GroupedCredit
  className?: string
  mirror?: boolean
}) {
  const href = credit.projectSlug
    ? `/portfolio/${credit.projectSlug}`
    : undefined

  const imageShell = cn(
    'relative aspect-[5/4] w-full overflow-hidden border-b border-white/10',
    'sm:aspect-auto sm:min-h-0 sm:w-[8.5rem] sm:self-stretch sm:border-b-0 sm:border-r md:w-28 lg:w-32',
    mirror && 'md:border-r-0 md:border-l',
  )

  const body = (
    <>
      {credit.cardImage ? (
        <div className={imageShell}>
          <img
            src={credit.cardImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:object-[center_12%]"
            loading="lazy"
            decoding="async"
          />
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:to-black/45',
              mirror && 'md:bg-gradient-to-l md:from-transparent md:to-black/45',
            )}
            aria-hidden
          />
        </div>
      ) : (
        <div className={cn(imageShell, 'bg-black')} aria-hidden>
          <div className="spotlight-empty-grid absolute inset-0 opacity-70" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:gap-2.5 sm:p-4 md:gap-2 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <p className="font-heading text-xs tracking-[0.14em] text-primary">
            {credit.yearLabel}
          </p>
          <Badge
            variant={credit.role === 'FOH Engineer' ? 'muted' : 'default'}
            className="w-fit shrink-0"
          >
            {roleBadgeLabel(credit.role)}
          </Badge>
        </div>

        <div className="min-w-0">
          <p className="font-heading text-lg tracking-[0.06em] text-white transition-colors duration-500 group-hover:text-primary sm:text-xl md:text-lg lg:text-xl">
            {credit.artist}
          </p>
          <p className="mt-1 text-sm text-muted md:mt-0.5 md:text-xs lg:text-sm">
            {credit.region}
          </p>
        </div>

        {href ? (
          <p className="font-heading inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-primary/80 uppercase transition-colors group-hover:text-primary">
            View project
            <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
          </p>
        ) : null}
      </div>
    </>
  )

  const cardClass = cn(
    'glass-card group flex h-full w-full min-w-0 flex-col overflow-hidden p-0 transition-[transform,box-shadow,border-color] duration-700 ease-out',
    'sm:flex-row sm:items-stretch',
    mirror && 'md:flex-row-reverse',
    href &&
      'card-lift hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_28px_rgba(184,255,0,0.08)]',
    className,
  )

  if (href) {
    return (
      <Link to={href} className={cn(cardClass, 'focus-visible:outline-none')}>
        {body}
      </Link>
    )
  }

  return <div className={cardClass}>{body}</div>
}

export function CreditsTimeline() {
  const [role, setRole] = useState<CreditRoleFilter>('all')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const credits = useMemo(() => getPortfolioCredits(role), [role, version])

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1)
    window.addEventListener(CREDITS_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CREDITS_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const container = reduced ? undefined : staggerContainer

  const totalPages = Math.max(1, Math.ceil(credits.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageCredits = credits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleRoleChange(next: CreditRoleFilter) {
    setRole(next)
    setPage(1)
  }

  function goToPage(next: number) {
    const clamped = Math.min(totalPages, Math.max(1, next))
    if (clamped === currentPage) return
    setPage(clamped)
    scrollCreditsSectionIntoView(reduced)
  }

  return (
    <div>
      <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
        <span className="metal-overlay" aria-hidden />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <VuPlate className="shrink-0">Timeline</VuPlate>
          <h1 className="font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-right">
            Career Credits
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div
            className="flex min-w-0 flex-wrap gap-2"
            role="tablist"
            aria-label="Filter credits by role"
          >
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={role === filter.id}
                onClick={() => handleRoleChange(filter.id)}
                className={cn(
                  'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
                  role === filter.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted hover:border-primary hover:text-primary',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {credits.length > PAGE_SIZE ? (
            <CreditsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              label="Credits pagination top"
              variant="rail"
              className="shrink-0 self-end sm:self-auto"
            />
          ) : null}
        </div>
      </div>

      <div className="relative mt-10">
        {/* Mobile left rail */}
        <span
          className="pointer-events-none absolute top-8 bottom-8 left-[6px] w-px -translate-x-1/2 bg-white/20 md:hidden"
          aria-hidden
        />
        {/* Desktop center rail */}
        <span
          className="pointer-events-none absolute top-6 bottom-6 left-1/2 hidden w-px -translate-x-1/2 bg-white/20 md:block"
          aria-hidden
        />
        <motion.ul
          className="flex flex-col gap-3 md:gap-0"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Career credits"
          key={`${role}-${currentPage}`}
        >
          {pageCredits.map((credit, index) => {
            const alignLeft = index % 2 === 0
            return (
              <motion.li
                key={`${credit.yearLabel}-${credit.artist}-${credit.role}`}
                variants={item}
                className={cn(
                  'group/credit relative flex min-w-0 gap-4',
                  'md:grid md:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] md:items-start md:gap-x-4',
                  // Only opposite (right) column tucks up beside the previous left card
                  !alignLeft && 'md:-mt-20 lg:-mt-24',
                )}
                style={{ zIndex: index + 1 }}
              >
                {/* Mobile left rail dot */}
                <div className="relative w-3 shrink-0 md:hidden" aria-hidden>
                  <span className="absolute top-8 left-1/2 z-10 flex h-1.5 w-1.5 -translate-x-1/2 items-center justify-center">
                    <span className="absolute h-3 w-3 border border-white/35 transition-colors duration-500 group-hover/credit:border-primary" />
                    <span className="h-1.5 w-1.5 bg-white transition-[background-color,box-shadow] duration-500 group-hover/credit:bg-primary group-hover/credit:shadow-[0_0_10px_rgba(184,255,0,0.55)]" />
                  </span>
                </div>

                {/* Desktop center marker + year (newest → oldest) */}
                <div className="relative z-10 hidden flex-col items-center gap-1.5 pt-5 md:col-start-2 md:row-start-1 md:flex">
                  <span
                    className="relative flex h-1.5 w-1.5 items-center justify-center"
                    aria-hidden
                  >
                    <span className="absolute h-3 w-3 border border-white/35 transition-colors duration-500 group-hover/credit:border-primary" />
                    <span className="h-1.5 w-1.5 bg-white transition-[background-color,box-shadow] duration-500 group-hover/credit:bg-primary group-hover/credit:shadow-[0_0_10px_rgba(184,255,0,0.55)]" />
                  </span>
                  <p className="font-heading text-center text-[11px] leading-none tracking-[0.12em] text-white transition-colors duration-500 group-hover/credit:text-primary">
                    {credit.endYear}
                  </p>
                </div>

                <div
                  className={cn(
                    'min-w-0 flex-1 md:row-start-1',
                    alignLeft ? 'md:col-start-1' : 'md:col-start-3',
                  )}
                >
                  <CreditCard
                    credit={credit}
                    mirror={!alignLeft}
                    className="min-w-0"
                  />
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>

      {credits.length === 0 ? (
        <p className="text-muted">No credits in this filter.</p>
      ) : null}

      {credits.length > PAGE_SIZE ? (
        <CreditsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          label="Credits pagination bottom"
          className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8"
        />
      ) : null}
    </div>
  )
}
