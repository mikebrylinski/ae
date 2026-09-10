import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import {
  getPortfolioCredits,
  localizeGroupedCredit,
  type CreditRoleFilter,
} from '@/lib/content'
import { interpolate } from '@/i18n/ui'
import { useLanguage } from '@/i18n/LanguageProvider'
import { CREDITS_UPDATED_EVENT } from '@/lib/admin'
import {
  CREDITS_PAGE_PARAM,
  CREDITS_ROLE_PARAM,
  parseCreditsPage,
  parseCreditsRole,
  persistCreditsView,
  readStoredCreditsView,
  type CreditsView,
} from '@/lib/creditsView'
import { getLenis } from '@/hooks/useLenis'
import { Badge } from '@/components/ui/Badge'
import { VuPlate } from '@/components/ui/VuPlate'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { GroupedCredit } from '@/types'

const ROLE_FILTER_IDS: CreditRoleFilter[] = ['all', 'monitors', 'foh']

const PAGE_SIZE = 10

export const CAREER_CREDITS_SECTION_ID = 'career-credits'

function roleBadgeLabel(role: string, foh: string, monitors: string): string {
  if (role === 'FOH Engineer') return foh
  if (role === 'Monitor Engineer') return monitors
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
  const { t } = useLanguage()

  return (
    <nav
      className={cn(
        'flex flex-nowrap items-center',
        isRail
          ? 'justify-center gap-1 sm:justify-end'
          : 'justify-center gap-2 sm:justify-between sm:gap-4',
        className,
      )}
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={t.a11y.prevPage}
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
          t.credits.prev
        ) : (
          <>
            <span className="sm:hidden">{t.credits.prev}</span>
            <span className="hidden sm:inline">{t.credits.previous}</span>
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
            aria-label={interpolate(t.a11y.page, { n: pageNum })}
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
        aria-label={t.a11y.nextPage}
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
        {t.credits.next}
      </button>
    </nav>
  )
}

const CARD_IMAGE_FOCUS: Record<string, string> = {
  'golden-gospel-singers': 'object-center',
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
  const { lang, t } = useLanguage()
  const { currentPage, role } = useCreditsTimeline()
  const localized = localizeGroupedCredit(credit, lang)
  const href = credit.projectSlug
    ? `/portfolio/${credit.projectSlug}`
    : undefined

  const imageShell = cn(
    'relative w-[5.25rem] min-h-[5.75rem] shrink-0 self-stretch overflow-hidden border-r border-white/10',
    'sm:w-[8.5rem] sm:min-h-0 md:w-28 lg:w-32',
    mirror && 'md:border-r-0 md:border-l',
  )

  const body = (
    <>
      {credit.cardImage ? (
        <div className={imageShell}>
          <img
            src={credit.cardImage}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
              CARD_IMAGE_FOCUS[credit.projectSlug ?? ''] ??
                'object-top sm:object-[center_12%]',
            )}
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

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:gap-2.5 sm:p-4 md:gap-2">
        <p className="font-heading text-[10px] tracking-[0.12em] text-primary sm:text-xs sm:tracking-[0.14em]">
          {localized.yearLabel}
        </p>

        <div className="min-w-0">
          <p className="font-heading text-[0.95rem] leading-tight tracking-[0.05em] text-white transition-colors duration-500 group-hover:text-primary sm:text-xl sm:leading-normal sm:tracking-[0.06em] md:text-lg lg:text-xl">
            {credit.artist}
          </p>
          <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm md:mt-0.5 md:text-xs lg:text-sm">
            {localized.region}
          </p>
        </div>

        <div className="mt-auto flex items-end gap-1.5">
          {href ? (
            <p className="font-heading mr-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-primary/80 uppercase transition-colors group-hover:text-primary">
              {t.credits.viewProject}
              <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
            </p>
          ) : null}

          <Badge
            variant={credit.role === 'FOH Engineer' ? 'muted' : 'default'}
            className="ml-auto w-fit shrink-0 px-1.5 pt-[3px] pb-px text-[9px] leading-none sm:px-2.5 sm:pt-1 sm:pb-[3px] sm:text-[11px]"
          >
            {roleBadgeLabel(credit.role, t.credits.foh, t.credits.monitors)}
          </Badge>
        </div>
      </div>
    </>
  )

  const cardClass = cn(
    'glass-card group flex h-full w-full min-w-0 flex-row items-stretch overflow-hidden p-0 transition-[transform,box-shadow,border-color] duration-700 ease-out',
    mirror && 'md:flex-row-reverse',
    href &&
      'card-lift hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_28px_rgba(184,255,0,0.08)]',
    className,
  )

  if (href) {
    return (
      <Link
        to={href}
        state={{ page: currentPage, role } satisfies CreditsView}
        onClick={() => persistCreditsView({ page: currentPage, role })}
        className={cn(cardClass, 'focus-visible:outline-none')}
      >
        {body}
      </Link>
    )
  }

  return <div className={cardClass}>{body}</div>
}

type CreditsTimelineContextValue = {
  role: CreditRoleFilter
  credits: GroupedCredit[]
  pageCredits: GroupedCredit[]
  currentPage: number
  totalPages: number
  handleRoleChange: (next: CreditRoleFilter) => void
  goToPage: (next: number) => void
}

const CreditsTimelineContext = createContext<CreditsTimelineContextValue | null>(
  null,
)

function useCreditsTimeline() {
  const ctx = useContext(CreditsTimelineContext)
  if (!ctx) {
    throw new Error('CreditsTimeline parts must be rendered inside CreditsTimeline')
  }
  return ctx
}

export function CreditsTimelineHeader() {
  const {
    role,
    credits,
    currentPage,
    totalPages,
    handleRoleChange,
    goToPage,
  } = useCreditsTimeline()
  const { t } = useLanguage()

  return (
    <div className="glass-card glass-card--aurora p-6 sm:p-8 md:p-10">
      <span className="metal-overlay" aria-hidden />
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
        <VuPlate className="shrink-0">{t.credits.eyebrow}</VuPlate>
        <h1 className="font-heading min-w-0 text-center text-3xl tracking-[0.08em] text-white sm:text-4xl md:text-right">
          {t.credits.title}
        </h1>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div
          className="flex min-w-0 flex-wrap justify-center gap-2 sm:justify-start"
          role="tablist"
          aria-label={t.a11y.filterCredits}
        >
          {ROLE_FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={role === id}
              onClick={() => handleRoleChange(id)}
              className={cn(
                'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
                role === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted hover:border-primary hover:text-primary',
              )}
            >
              {id === 'all' ? t.credits.all : id === 'monitors' ? t.credits.monitors : t.credits.foh}
            </button>
          ))}
        </div>

        {credits.length > PAGE_SIZE ? (
          <CreditsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            label={t.a11y.creditsPageTop}
            variant="rail"
            className="shrink-0"
          />
        ) : null}
      </div>
    </div>
  )
}

export function CreditsTimelineList({ className }: { className?: string }) {
  const { role, credits, pageCredits, currentPage, totalPages, goToPage } =
    useCreditsTimeline()
  const { t } = useLanguage()
  const reduced = useReducedMotion()
  const item = reduced ? reducedMotionVariants : fadeUp
  const container = reduced ? undefined : staggerContainer

  return (
    <div className={className}>
      <div className="relative">
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
          className="flex flex-col gap-2 sm:gap-3 md:gap-0"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label={t.a11y.creditsList}
          key={`${role}-${currentPage}`}
        >
          {pageCredits.map((credit, index) => {
            const alignLeft = index % 2 === 0
            return (
              <motion.li
                key={`${credit.yearLabel}-${credit.artist}-${credit.role}`}
                variants={item}
                className={cn(
                  'group/credit relative flex min-w-0 gap-2.5 sm:gap-4',
                  'pointer-events-none md:grid md:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] md:items-start md:gap-x-4',
                  // Only opposite (right) column tucks up beside the previous left card
                  !alignLeft && 'md:-mt-20 lg:-mt-24',
                )}
                style={{ zIndex: index + 1 }}
              >
                {/* Mobile left rail dot */}
                <div className="relative w-3 shrink-0 md:hidden" aria-hidden>
                  <span className="absolute top-6 left-1/2 z-10 flex h-1.5 w-1.5 -translate-x-1/2 items-center justify-center">
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
                    'pointer-events-auto min-w-0 flex-1 md:row-start-1',
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
        <p className="text-muted">{t.credits.empty}</p>
      ) : null}

      {credits.length > PAGE_SIZE ? (
        <CreditsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          label={t.a11y.creditsPageBottom}
          className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8"
        />
      ) : null}
    </div>
  )
}

export function CreditsTimeline({ children }: { children?: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navType = useNavigationType()
  const stored = readStoredCreditsView()
  const urlHasPage = searchParams.has(CREDITS_PAGE_PARAM)
  const urlHasRole = searchParams.has(CREDITS_ROLE_PARAM)
  const role = parseCreditsRole(
    urlHasRole
      ? searchParams.get(CREDITS_ROLE_PARAM)
      : navType === 'POP'
        ? stored.role
        : 'all',
  )
  const page = parseCreditsPage(
    urlHasPage
      ? searchParams.get(CREDITS_PAGE_PARAM)
      : navType === 'POP'
        ? String(stored.page)
        : '1',
  )
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

  const totalPages = Math.max(1, Math.ceil(credits.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageCredits = credits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function writeCreditsParams(nextRole: CreditRoleFilter, nextPage: number) {
    persistCreditsView({ page: nextPage, role: nextRole })
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (nextRole === 'all') params.delete(CREDITS_ROLE_PARAM)
        else params.set(CREDITS_ROLE_PARAM, nextRole)
        if (nextPage <= 1) params.delete(CREDITS_PAGE_PARAM)
        else params.set(CREDITS_PAGE_PARAM, String(nextPage))
        return params
      },
      { replace: true },
    )
  }

  useEffect(() => {
    persistCreditsView({ page: currentPage, role })
  }, [currentPage, role])

  useEffect(() => {
    if (page > totalPages) writeCreditsParams(role, totalPages)
    // Clamp a stale URL page after the credits list shrinks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages, role])

  function handleRoleChange(next: CreditRoleFilter) {
    writeCreditsParams(next, 1)
  }

  function goToPage(next: number) {
    const clamped = Math.min(totalPages, Math.max(1, next))
    if (clamped === currentPage) return
    writeCreditsParams(role, clamped)
    scrollCreditsSectionIntoView(reduced)
  }

  return (
    <CreditsTimelineContext.Provider
      value={{
        role,
        credits,
        pageCredits,
        currentPage,
        totalPages,
        handleRoleChange,
        goToPage,
      }}
    >
      {children ?? (
        <>
          <CreditsTimelineHeader />
          <CreditsTimelineList className="mt-10" />
        </>
      )}
    </CreditsTimelineContext.Provider>
  )
}

CreditsTimeline.Header = CreditsTimelineHeader
CreditsTimeline.List = CreditsTimelineList
