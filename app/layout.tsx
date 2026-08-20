import { ReactNode } from 'react';
import './globals.css';

// Ce layout racine ne doit PAS avoir de html/body
// Il sert uniquement à envelopper le layout dynamique
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}