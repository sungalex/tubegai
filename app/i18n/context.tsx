import { createContext, useContext, useState, useCallback } from "react";
import { useTranslation as useI18nextTranslation } from "react-i18next";
import type { Locale } from "./config";
import { initI18n, i18n } from "./config";
import { LOCALE_COOKIE_NAME } from "./server";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale: Locale;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Initialize i18n synchronously before children render to prevent hydration mismatch
  if (!i18n.isInitialized) {
    initI18n(initialLocale);
  }

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);

    // Set cookie for persistence
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Reload page to apply SSR changes
    window.location.reload();
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Re-export useTranslation for convenience
export { useI18nextTranslation as useTranslation };
