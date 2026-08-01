import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  getPortfolioCredits,
  type CreditRoleFilter,
} from '@/lib/content'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, reducedMotionVariants, staggerContainer } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const ROLE_FILTERS: { id: CreditRoleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'monitors', label: 'Monitors' },
  { id: 'foh', label: 'FOH' },
]

const PAGE_SIZE = 10

export function CreditsTimeline() {
  const [role, setRole] = useState<CreditRoleFilter>('all')
  const [page, setPage] = useState(1)
  const credits = useMemo(() => getPortfolioCredits(role), [role])
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

  return (
    <div>
      <div
        className="mb-10 flex flex-wrap gap-2"
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

      <motion.ol
        className="relative space-y-0 border-l border-border"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        aria-label="Career credits timeline"
        key={`${role}-${currentPage}`}
      >
        {pageCredits.map((credit) => (
          <motion.li
            key={`${credit.yearLabel}-${credit.artist}-${credit.role}`}
            variants={item}
            className="relative border-b border-border py-7 pl-8 last:border-b-0 md:pl-12"
          >
            <span
              className="absolute top-9 -left-[5px] h-2.5 w-2.5 bg-primary"
              aria-hidden
            />
            <div className="grid gap-3 md:grid-cols-[11rem_1fr_auto] md:items-baseline md:gap-8">
              <p className="font-heading text-sm tracking-[0.14em] text-primary md:pt-1">
                {credit.yearLabel}
              </p>
              <div className="min-w-0">
                <p className="font-heading text-lg tracking-[0.06em] text-white sm:text-xl">
                  {credit.artist}
                </p>
                <p className="mt-1 text-sm text-muted">{credit.region}</p>
              </div>
              <Badge
                variant={
                  credit.role === 'FOH Engineer' ? 'muted' : 'default'
                }
                className="w-fit shrink-0"
              >
                {credit.role === 'FOH Engineer' ? 'FOH' : 'Monitors'}
              </Badge>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      {credits.length === 0 ? (
        <p className="text-muted">No credits in this filter.</p>
      ) : null}

      {credits.length > PAGE_SIZE ? (
        <nav
          className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
          aria-label="Credits pagination"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className={cn(
              'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
              currentPage <= 1
                ? 'cursor-not-allowed border-border text-muted/40'
                : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
            )}
          >
            Previous
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pageNum === currentPage ? 'page' : undefined}
                  className={cn(
                    'font-heading flex h-9 w-9 items-center justify-center border text-xs tracking-[0.08em] transition-colors',
                    pageNum === currentPage
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  {pageNum}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className={cn(
              'font-heading border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors',
              currentPage >= totalPages
                ? 'cursor-not-allowed border-border text-muted/40'
                : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
            )}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  )
}
