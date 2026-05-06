'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { type Locale, type TranslationKey, type TranslationKey as TK, t as translate, defaultLocale, locales, localeNames } from '@/i18n/translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TK, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key, params) => translate(key, defaultLocale, params),
});

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale || defaultLocale);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      document.cookie = `atlas_locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, []);

  const tFn = useCallback(
    (key: TK, params?: Record<string, string | number>) => translate(key, locale, params),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { locales, localeNames };
export type { Locale, TranslationKey as TK };
