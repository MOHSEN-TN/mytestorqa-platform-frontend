/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.cookie = `NEXT_LOCALE=${locale}; path=/`;
  }, [locale]);

  if (!mounted) {
    return null; // Évite l'hydration mismatch
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        {children}
      </Provider>
    </I18nextProvider>
  );
}