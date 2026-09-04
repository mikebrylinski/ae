import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterAccordionProps {
  label: string
  summary?: string
  toggleLabel?: string
  children: ReactNode
  className?: string
}

/** Collapsed-by-default rack accordion for long filter / tag chip rows. */
export function FilterAccordion({
  label,
  summary,
  toggleLabel,
  children,
  className,
}: FilterAccordionProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const active = Boolean(summary)

  return (
    <div className={cn('filter-accordion', className)}>
      <button
        type="button"
        className={cn(
          'filter-accordion__toggle',
          open && 'is-open',
          active && 'is-active',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={toggleLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="filter-accordion__led" aria-hidden />
        <span className="filter-accordion__face">
          <span className="filter-accordion__label">{label}</span>
          {summary ? (
            <span className="filter-accordion__summary">{summary}</span>
          ) : null}
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className={cn(
              'filter-accordion__chevron',
              open && 'is-open',
            )}
            aria-hidden
          />
        </span>
      </button>
      <div
        id={panelId}
        className={cn('filter-accordion__panel', open && 'is-open')}
        hidden={!open}
      >
        <div className="filter-accordion__body">{children}</div>
      </div>
    </div>
  )
}
