import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  type Language,
} from './types'
import { getUiCopy, type UiCopy } from './ui'

type LanguageContextValue = {
  lang: Language
  setLang: (lang: Language) => void
  t: UiCopy
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLang(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : null
  } catch {
    return null
  }
}

function persistLang(lang: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch {
    /* ignore quota / private mode */
  }
}

function applyDocumentLang(lang: Language) {
  document.documentElement.lang = lang
}

function readInitialLang(searchLang: string | null): Language {
  if (isLanguage(searchLang)) return searchLang
  return readStoredLang() ?? 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [lang, setLangState] = useState<Language>(() =>
    readInitialLang(searchParams.get('lang')),
  )

  useEffect(() => {
    applyDocumentLang(lang)
    persistLang(lang)
  }, [lang])

  useEffect(() => {
    const fromUrl = searchParams.get('lang')
    if (isLanguage(fromUrl) && fromUrl !== lang) {
      setLangState(fromUrl)
    }
    // Only react to explicit URL changes, not to our own lang writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next)
      persistLang(next)
      applyDocumentLang(next)

      const params = new URLSearchParams(searchParams)
      if (next === 'en') params.delete('lang')
      else params.set('lang', next)
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: getUiCopy(lang) }),
    [lang, setLang],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
