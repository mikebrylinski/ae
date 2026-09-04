export type Language = 'en' | 'de'

export const LANGUAGES: readonly Language[] = ['en', 'de'] as const

export const LANGUAGE_STORAGE_KEY = 'ae-lang'

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'de'
}
