import en from './translations/en';
import es from './translations/es';
import de from './translations/de';
import type { TranslationKey } from './translations/en';

export type Locale = 'en' | 'es' | 'de';

export const LOCALE_LABELS: Record<Locale, string> = {
    en: 'English',
    es: 'Espanol',
    de: 'Deutsch',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
    en: 'EN',
    es: 'ES',
    de: 'DE',
};

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, es, de };

export function getTranslation(locale: Locale) {
    const dict = dictionaries[locale];
    return function t(key: TranslationKey, params?: Record<string, string | number>): string {
        let value = dict[key] ?? en[key] ?? key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                value = value.replace(`{${k}}`, String(v));
            }
        }
        return value;
    };
}

export type { TranslationKey };
