'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getTranslation, type Locale, type TranslationKey } from '@/lib/i18n';

type LanguageContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
    locale: 'en',
    setLocale: () => {},
    t: (key) => key,
});

export function useLanguage() {
    return useContext(LanguageContext);
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('locale') as Locale | null;
        if (stored && ['en', 'es', 'de'].includes(stored)) {
            setLocaleState(stored);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('locale', locale);
        document.documentElement.lang = locale;
    }, [locale, mounted]);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
    }, []);

    const t = useCallback(
        (key: TranslationKey, params?: Record<string, string | number>) => getTranslation(locale)(key, params),
        [locale],
    );

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
