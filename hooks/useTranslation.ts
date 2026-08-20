'use client';

import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nTranslation(namespace);
  
  const changeLanguage = async (locale: string) => {
    await i18n.changeLanguage(locale);
    document.cookie = `NEXT_LOCALE=${locale}; path=/`;
    document.documentElement.lang = locale;
    
    // Optionnel: recharger la page pour les composants serveur
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };
  
  return {
    t,
    i18n,
    locale: i18n.language,
    changeLanguage,
  };
}