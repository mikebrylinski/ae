export type AnalyticsMetric = {
  label: string
  pageviews: number
  visitors: number
}

export type AnalyticsDay = {
  date: string
  pageviews: number
  visitors: number
}

export type AnalyticsReport = {
  ok: true
  configured: true
  range: string
  granularity: 'hour' | 'day'
  since: string
  until: string
  totals: { pageviews: number; visitors: number }
  series: AnalyticsDay[]
  pages: AnalyticsMetric[]
  countries: AnalyticsMetric[]
  referrers: AnalyticsMetric[]
  devices: AnalyticsMetric[]
  browsers: AnalyticsMetric[]
  os: AnalyticsMetric[]
}

export type AnalyticsBucketDetail = {
  ok: true
  configured: true
  detail: true
  granularity: 'hour' | 'day'
  since: string
  until: string
  totals: { pageviews: number; visitors: number }
  pages: AnalyticsMetric[]
  countries: AnalyticsMetric[]
  referrers: AnalyticsMetric[]
  devices: AnalyticsMetric[]
  browsers: AnalyticsMetric[]
  os: AnalyticsMetric[]
}

export type AnalyticsFailure = {
  ok: false
  configured: boolean
  status?: number
  error: string
}

export function normalizeAnalyticsRange(value: string): '24h' | '7d' | '30d'

export function bucketWindow(
  bucket: string,
  granularity?: 'hour' | 'day',
): {
  since: string
  until: string
  granularity: 'hour' | 'day'
  label: string
} | null

export function loadAdminAnalytics(
  env: Record<string, string | undefined>,
  rangeInput: string,
  options?: { fresh?: boolean },
): Promise<AnalyticsReport | AnalyticsFailure>

export function loadAnalyticsBucketDetail(
  env: Record<string, string | undefined>,
  bucket: string,
  granularity?: 'hour' | 'day',
): Promise<AnalyticsBucketDetail | AnalyticsFailure>
