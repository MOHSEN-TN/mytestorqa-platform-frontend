export const locales = ['fr', 'en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English'
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧'
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr'
};

// Ajout de getOptions
export function getOptions(lng: Locale = defaultLocale, ns: string | string[] = 'common') {
  return {
    // debug: true,
    supportedLngs: locales,
    fallbackLng: defaultLocale,
    lng,
    fallbackNS: 'common',
    defaultNS: 'common',
    ns,
  };
}