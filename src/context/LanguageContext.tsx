import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
import type { Language } from '../types';

type Translations = typeof fr;

interface LanguageContextValue {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
  formatDZD: (amount: number) => string;
}

const translations: Record<Language, Translations> = { fr, ar };

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'barbershopdz_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'ar' || saved === 'fr' ? saved : 'fr';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, isRTL]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  }, []);

  const t = useCallback(
    (path: string): string => {
      const keys = path.split('.');
      let current: unknown = translations[language];
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return path;
        }
      }
      return typeof current === 'string' ? current : path;
    },
    [language]
  );

  const formatDZD = useCallback(
    (amount: number): string => {
      const formatted = new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
      return `${formatted} ${language === 'ar' ? 'دج' : 'DZD'}`;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, isRTL, setLanguage, toggleLanguage, t, formatDZD }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
