import { Inter } from 'next/font/google';
import { locales, localeDirections } from '../../i18n/settings';
import ClientLayout from './clientLayout';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Correction pour Next.js 15+ : params est une Promise
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const direction = localeDirections[locale as keyof typeof localeDirections] || 'ltr';
  
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout locale={locale}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}