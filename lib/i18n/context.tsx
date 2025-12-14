"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { type Locale, translations } from "./translations"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  language: Locale
  setLanguage: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [isHydrated, setIsHydrated] = useState(false)
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    setIsHydrated(true)
    // Get saved locale from localStorage or detect from browser
    const savedLocale = localStorage.getItem("vibe2gether-locale") as Locale
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale)
      document.documentElement.dir = savedLocale === "ar" || savedLocale === "he" ? "rtl" : "ltr"
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0] as Locale
      if (translations[browserLang]) {
        setLocaleState(browserLang)
        document.documentElement.dir = browserLang === "ar" || browserLang === "he" ? "rtl" : "ltr"
      }
    }
  }, [])

  const handleSetLocale = useCallback((newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocaleState(newLocale)
      localStorage.setItem("vibe2gether-locale", newLocale)
      // Update document direction for RTL languages
      document.documentElement.dir = newLocale === "ar" || newLocale === "he" ? "rtl" : "ltr"
      // Force a re-render by updating the key
      setRenderKey((prev) => prev + 1)
      // Dispatch custom event to ensure all listeners are notified
      window.dispatchEvent(new CustomEvent("localechange", { detail: { locale: newLocale } }))
    }
  }, [locale])

  const t = useCallback((key: string): string => {
    const localeTranslations = translations[locale] as Record<string, string> | undefined
    const enTranslations = translations.en as Record<string, string>
    return localeTranslations?.[key] || enTranslations[key] || key
  }, [locale])

  const value: I18nContextType = useMemo(
    () => ({
      locale,
      setLocale: handleSetLocale,
      language: locale,
      setLanguage: handleSetLocale,
      t,
    }),
    [locale, handleSetLocale, t, renderKey]
  )

  // On server side or before hydration, render children without context
  if (!isHydrated) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={value} key={renderKey}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  
  // Fallback for SSR or when context is not available
  if (!context) {
    const enTranslations = translations.en as Record<string, string>
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      language: "en" as Locale,
      setLanguage: () => {},
      t: (key: string) => enTranslations[key] || key,
    }
  }
  
  return context
}

export function useLanguage() {
  return useI18n()
}
