import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AppWindow,
  Cpu,
  FileText,
  Globe2,
  Link2,
  MonitorSmartphone,
  X,
  type LucideIcon,
} from 'lucide-react'
import { getAdminPassword, getSessionPassword } from '@/lib/admin'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PANEL_ICONS: Record<string, LucideIcon> = {
  Pages: FileText,
  Referrers: Link2,
  Countries: Globe2,
  Devices: MonitorSmartphone,
  Browsers: AppWindow,
  'Operating Systems': Cpu,
}

type Range = '24h' | '7d' | '30d'
type Metric = 'visitors' | 'pageviews'

type MetricRow = {
  label: string
  pageviews: number
  visitors: number
}

type SeriesPoint = {
  date: string
  pageviews: number
  visitors: number
}

type AnalyticsReport = {
  range: Range | string
  granularity?: 'hour' | 'day'
  since: string
  until: string
  totals: { pageviews: number; visitors: number }
  series: SeriesPoint[]
  pages: MetricRow[]
  countries: MetricRow[]
  referrers: MetricRow[]
  devices: MetricRow[]
  browsers: MetricRow[]
  os: MetricRow[]
}

type BucketDetail = {
  granularity: 'hour' | 'day'
  since: string
  until: string
  totals: { pageviews: number; visitors: number }
  pages: MetricRow[]
  countries: MetricRow[]
  referrers: MetricRow[]
  devices: MetricRow[]
  browsers: MetricRow[]
  os: MetricRow[]
}

const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
]

const METRICS: { id: Metric; label: string }[] = [
  { id: 'visitors', label: 'Visitors' },
  { id: 'pageviews', label: 'Page Views' },
]

function adminPassword() {
  return getSessionPassword() || getAdminPassword()
}

function formatCount(value: number) {
  return value.toLocaleString()
}

function formatPercent(part: number, whole: number) {
  if (!whole) return '0%'
  return `${((part / whole) * 100).toFixed(part / whole >= 0.1 ? 0 : 1)}%`
}

function formatDay(iso: string) {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatTick(iso: string, granularity: 'hour' | 'day') {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return iso
  if (granularity === 'hour') {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      timeZone: 'UTC',
    })
  }
  return formatDay(iso)
}

function formatBarLabel(iso: string, granularity: 'hour' | 'day') {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return iso
  if (granularity === 'hour') {
    return date.toLocaleString(undefined, {
      hour: 'numeric',
      timeZone: 'UTC',
    })
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatDetailTitle(iso: string, granularity: 'hour' | 'day') {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return iso
  if (granularity === 'hour') {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    })
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function shouldShowAxisLabel(index: number, total: number, granularity: 'hour' | 'day') {
  if (total <= 10) return true
  if (granularity === 'hour') return index % 3 === 0 || index === total - 1
  if (total <= 16) return true
  return index % 2 === 0 || index === total - 1
}

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

function countryName(code: string) {
  if (code === 'Others' || code === 'Other') return 'Others'
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

function titleCase(value: string) {
  if (value === 'Others' || value === 'Other') return 'Others'
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function referrerName(value: string) {
  if (!value || value === '(direct)' || value.toLowerCase() === 'direct') return 'Direct'
  if (value === 'Others' || value === 'Other') return 'Others'
  return value
}

function pageName(value: string) {
  if (value === 'Others' || value === 'Other') return 'Others'
  return value || '/'
}

function sortRows(rows: MetricRow[], metric: Metric) {
  return [...rows].sort(
    (a, b) => b[metric] - a[metric] || b.pageviews - a.pageviews || b.visitors - a.visitors,
  )
}

export function AnalyticsPanel() {
  const [range, setRange] = useState<Range>('7d')
  const [metric, setMetric] = useState<Metric>('visitors')
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [status, setStatus] = useState('Loading analytics…')
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selected, setSelected] = useState<SeriesPoint | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    setSelected(null)

    async function load() {
      try {
        const params = new URLSearchParams({ range })
        if (refreshKey > 0) params.set('fresh', '1')
        const res = await fetch(`/api/admin/analytics?${params}`, {
          headers: { 'X-Admin-Password': adminPassword() },
        })
        const data = (await res.json().catch(() => ({}))) as AnalyticsReport & {
          ok?: boolean
          error?: string
          configured?: boolean
        }
        if (id !== requestId.current) return
        if (!res.ok || !data.ok) {
          setReport(null)
          setConfigured(data.configured !== false)
          setError(data.error || 'Could not load analytics')
          setStatus('')
          return
        }
        setConfigured(true)
        setReport(data)
        setError('')
        setStatus(
          `Same data as the Vercel Web Analytics dashboard · Production · ${formatDay(data.since)} – ${formatDay(data.until)} UTC`,
        )
      } catch {
        if (id !== requestId.current) return
        setReport(null)
        setError('Could not reach the analytics API')
        setStatus('')
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }

    void load()
  }, [range, refreshKey])

  const granularity = report?.granularity === 'hour' ? 'hour' : 'day'
  const peak = Math.max(1, ...(report?.series.map((point) => point[metric]) ?? [1]))
  const totalMetric = report?.totals[metric] ?? 0

  const panels = useMemo(() => {
    if (!report) return []
    return [
      { title: 'Pages', rows: sortRows(report.pages, metric), formatLabel: pageName },
      { title: 'Referrers', rows: sortRows(report.referrers, metric), formatLabel: referrerName },
      { title: 'Countries', rows: sortRows(report.countries, metric), formatLabel: countryName },
      { title: 'Devices', rows: sortRows(report.devices, metric), formatLabel: titleCase },
      { title: 'Browsers', rows: sortRows(report.browsers ?? [], metric), formatLabel: titleCase },
      { title: 'Operating Systems', rows: sortRows(report.os ?? [], metric), formatLabel: titleCase },
    ]
  }, [metric, report])

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-white">
            Analytics
          </h1>
          <p className={cn('mt-2 text-sm', error ? 'text-red-400' : 'text-muted')}>
            {error || status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={range === item.id}
                onClick={() => setRange(item.id)}
                className={cn(
                  'font-heading h-10 border px-4 text-xs tracking-[0.12em] uppercase transition-colors',
                  range === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted hover:border-primary hover:text-primary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setRefreshKey((current) => current + 1)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {!configured ? (
        <div className="border border-border p-4 text-sm leading-relaxed text-muted sm:p-5">
          <p>
            Create a Vercel access token that can read this project, then set{' '}
            <span className="text-white">VERCEL_ACCESS_TOKEN</span>. On Vercel,
            add it under Project Settings → Environment Variables and redeploy.
            <span className="text-white"> VERCEL_PROJECT_ID</span> and{' '}
            <span className="text-white">VERCEL_TEAM_ID</span> are already set
            there.
          </p>
          <p className="mt-3">
            For a local preview, put the token, project id, and team id in{' '}
            <span className="text-white">.env.local</span> and restart the dev
            server.
          </p>
        </div>
      ) : null}

      {report ? (
        <div className={cn(loading && 'opacity-60')}>
          <div
            className="mb-3 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Analytics metric"
          >
            {METRICS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={metric === item.id}
                onClick={() => setMetric(item.id)}
                className={cn(
                  'font-heading h-10 border px-4 text-xs tracking-[0.12em] uppercase transition-colors',
                  metric === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted hover:border-primary hover:text-primary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Visitors"
              value={report.totals.visitors}
              active={metric === 'visitors'}
              onClick={() => setMetric('visitors')}
            />
            <Stat
              label="Page Views"
              value={report.totals.pageviews}
              active={metric === 'pageviews'}
              onClick={() => setMetric('pageviews')}
            />
          </div>

          <section className="mt-3 border border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-sm tracking-[0.1em] text-white uppercase">
                {metric === 'visitors' ? 'Visitors' : 'Page Views'} over time
              </h2>
              <p className="text-xs text-muted">Click a point for details</p>
            </div>
            <TrafficLineChart
              series={report.series}
              metric={metric}
              peak={peak}
              granularity={granularity}
              selected={selected}
              onSelect={setSelected}
              since={report.since}
              until={report.until}
            />
          </section>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {panels.map((panel) => (
              <Breakdown
                key={panel.title}
                title={panel.title}
                rows={panel.rows}
                metric={metric}
                total={totalMetric}
                formatLabel={panel.formatLabel}
              />
            ))}
          </div>
        </div>
      ) : null}

      {selected && report ? (
        <BucketDetailOverlay
          point={selected}
          rangeTotals={report.totals}
          granularity={granularity}
          metric={metric}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}

function BucketDetailOverlay({
  point,
  rangeTotals,
  granularity,
  metric,
  onClose,
}: {
  point: SeriesPoint
  rangeTotals: { pageviews: number; visitors: number }
  granularity: 'hour' | 'day'
  metric: Metric
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [detail, setDetail] = useState<BucketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setDetail(null)

    async function load() {
      try {
        const params = new URLSearchParams({
          bucket: point.date,
          granularity,
        })
        const res = await fetch(`/api/admin/analytics?${params}`, {
          headers: { 'X-Admin-Password': adminPassword() },
        })
        const data = (await res.json().catch(() => ({}))) as BucketDetail & {
          ok?: boolean
          error?: string
        }
        if (cancelled) return
        if (!res.ok || !data.ok) {
          setError(data.error || 'Could not load details')
          return
        }
        setDetail(data)
      } catch {
        if (!cancelled) setError('Could not reach the analytics API')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [granularity, point.date])

  const totals = {
    visitors: detail?.totals.visitors || point.visitors,
    pageviews: detail?.totals.pageviews || point.pageviews,
  }

  const panels = detail
    ? [
        { title: 'Pages', rows: sortRows(detail.pages, metric), formatLabel: pageName },
        { title: 'Referrers', rows: sortRows(detail.referrers, metric), formatLabel: referrerName },
        { title: 'Countries', rows: sortRows(detail.countries, metric), formatLabel: countryName },
        { title: 'Devices', rows: sortRows(detail.devices, metric), formatLabel: titleCase },
        { title: 'Browsers', rows: sortRows(detail.browsers, metric), formatLabel: titleCase },
        { title: 'Operating Systems', rows: sortRows(detail.os, metric), formatLabel: titleCase },
      ]
    : []

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 py-8 sm:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-card relative my-auto w-full max-w-3xl space-y-5 p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
              {granularity === 'hour' ? 'Hour detail' : 'Day detail'} · UTC
            </p>
            <h2
              id={titleId}
              className="font-heading mt-2 text-2xl tracking-[0.06em] text-white"
            >
              {formatDetailTitle(point.date, granularity)}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close analytics detail"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="border border-border p-4">
            <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
              Visitors
            </p>
            <p className="mt-2 font-heading text-3xl tracking-[0.04em] text-white">
              {formatCount(totals.visitors)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatPercent(totals.visitors, rangeTotals.visitors)} of selected range
            </p>
          </article>
          <article className="border border-border p-4">
            <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
              Page Views
            </p>
            <p className="mt-2 font-heading text-3xl tracking-[0.04em] text-white">
              {formatCount(totals.pageviews)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatPercent(totals.pageviews, rangeTotals.pageviews)} of selected range
            </p>
          </article>
        </div>

        {loading ? <p className="text-sm text-muted">Loading breakdown…</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {!loading && !error && detail ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {panels.map((panel) => (
              <Breakdown
                key={panel.title}
                title={panel.title}
                rows={panel.rows}
                metric={metric}
                total={totals[metric]}
                formatLabel={panel.formatLabel}
                compact
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

function TrafficLineChart({
  series,
  metric,
  peak,
  granularity,
  selected,
  onSelect,
  since,
  until,
}: {
  series: SeriesPoint[]
  metric: Metric
  peak: number
  granularity: 'hour' | 'day'
  selected: SeriesPoint | null
  onSelect: (point: SeriesPoint) => void
  since: string
  until: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const gradientId = useId().replace(/:/g, '')
  const [hover, setHover] = useState<string | null>(null)
  const [width, setWidth] = useState(720)
  const height = 224
  const pad = { top: 28, right: 8, bottom: 8, left: 8 }
  const innerW = Math.max(width - pad.left - pad.right, 1)
  const innerH = height - pad.top - pad.bottom
  const count = Math.max(series.length, 1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const next = Math.round(el.getBoundingClientRect().width)
      if (next > 0) setWidth(next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const points = series.map((point, index) => {
    const x =
      pad.left + (count === 1 ? innerW / 2 : (index / (count - 1)) * innerW)
    const y = pad.top + innerH - (point[metric] / peak) * innerH
    return { point, x, y, value: point[metric] }
  })

  const linePath = points
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x.toFixed(2)} ${item.y.toFixed(2)}`)
    .join(' ')

  const areaPath =
    points.length === 0
      ? ''
      : `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} Z`

  const activeDate = hover ?? selected?.date ?? null

  return (
    <div ref={wrapRef} className="mt-4 w-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full overflow-visible text-primary"
        role="img"
        aria-label={`${metric} from ${formatTick(since, granularity)} to ${formatTick(until, granularity)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = pad.top + innerH * (1 - step)
          return (
            <line
              key={step}
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          )
        })}

        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {points.map(({ point, x, y, value }) => {
          const active = activeDate === point.date
          return (
            <g key={point.date}>
              {active ? (
                <line
                  x1={x}
                  x2={x}
                  y1={pad.top}
                  y2={pad.top + innerH}
                  stroke="currentColor"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />
              ) : null}
              <circle
                cx={x}
                cy={y}
                r={active ? 5 : 3.5}
                fill={active ? '#fff' : 'currentColor'}
                stroke="#000"
                strokeWidth="1.5"
              />
              {active || series.length <= 10 ? (
                <text
                  x={x}
                  y={Math.max(12, y - 12)}
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: 10, fontFamily: 'var(--font-heading)' }}
                >
                  {formatCount(value)}
                </text>
              ) : null}
              <rect
                x={x - Math.max(innerW / count / 2, 10)}
                y={pad.top}
                width={Math.max(innerW / count, 20)}
                height={innerH}
                fill="transparent"
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${formatTick(point.date, granularity)}: ${formatCount(point.visitors)} visitors, ${formatCount(point.pageviews)} page views. Open details.`}
                onMouseEnter={() => setHover(point.date)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(point.date)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(point)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(point)
                  }
                }}
              />
            </g>
          )
        })}
      </svg>

      <div className="relative mt-2 h-8 w-full">
        {series.map((point, index) => {
          if (!shouldShowAxisLabel(index, series.length, granularity)) return null
          const left =
            count === 1 ? 50 : (index / (count - 1)) * 100
          return (
            <span
              key={point.date}
              className="font-heading absolute top-0 -translate-x-1/2 text-[9px] tracking-[0.04em] text-muted uppercase"
              style={{ left: `${left}%` }}
            >
              {formatBarLabel(point.date, granularity)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border p-5 text-left transition-colors',
        active ? 'border-primary' : 'border-border hover:border-primary/60',
      )}
    >
      <p className="font-heading text-[10px] tracking-[0.16em] text-primary uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-4xl tracking-[0.04em] text-white">
        {formatCount(value)}
      </p>
    </button>
  )
}

function Breakdown({
  title,
  rows,
  metric,
  total,
  formatLabel,
  compact = false,
}: {
  title: string
  rows: MetricRow[]
  metric: Metric
  total: number
  formatLabel: (value: string) => string
  compact?: boolean
}) {
  const max = Math.max(1, ...rows.map((row) => row[metric]))
  const Icon = PANEL_ICONS[title]

  return (
    <section className="border border-border p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading flex items-center gap-2 text-sm tracking-[0.1em] text-white uppercase">
          {Icon ? <Icon size={14} className="shrink-0 text-primary" aria-hidden /> : null}
          {title}
        </h2>
        <p className="font-heading text-[10px] tracking-[0.12em] text-muted uppercase">
          {metric === 'visitors' ? 'Visitors' : 'Page Views'}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No data in this range.</p>
      ) : (
        <ul className={cn('mt-4 space-y-3', compact && 'space-y-2.5')}>
          {rows.map((row) => {
            const value = row[metric]
            return (
              <li key={`${title}-${row.label}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">
                    {formatLabel(row.label)}
                  </span>
                  <span className="shrink-0 text-muted">
                    {formatCount(value)}
                    <span className="ml-2 text-[10px] tracking-[0.08em] uppercase">
                      {formatPercent(value, total)}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 bg-white/10">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
