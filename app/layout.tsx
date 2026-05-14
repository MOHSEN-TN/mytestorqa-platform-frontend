import "./globals.css";
import ReduxProvider from "@/lib/store/provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body cz-shortcut-listen="true">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}