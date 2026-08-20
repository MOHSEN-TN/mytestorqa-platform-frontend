/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, localeDirections, locales } from "./i18n/settings";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ========== PARTIE 1: GESTION DE LA LANGUE (i18n) ==========
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  let response = NextResponse.next();
  let locale = defaultLocale;

  if (!pathnameHasLocale) {
    const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
    const acceptLanguage = request.headers.get("accept-language");

    if (localeCookie && locales.includes(localeCookie as any)) {
      locale = localeCookie as any;
    } else if (acceptLanguage) {
      const preferred = acceptLanguage.split(",")[0].split("-")[0];

      if (locales.includes(preferred as any)) {
        locale = preferred as any;
      }
    }

    const url = new URL(`/${locale}${pathname}`, request.url);

    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale);
    response.cookies.set(
      "NEXT_LOCALE_DIR",
      localeDirections[locale as keyof typeof localeDirections],
    );

    return response;
  }

  const pathLocale = pathname.split("/")[1];

  if (locales.includes(pathLocale as any)) {
    locale = pathLocale as any;

    response.cookies.set("NEXT_LOCALE", locale);
    response.cookies.set(
      "NEXT_LOCALE_DIR",
      localeDirections[locale as keyof typeof localeDirections],
    );
  }

  // ========== PARTIE 2: AUTHENTIFICATION ==========
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  const token = request.cookies.get("accessToken")?.value;

  const isAuthPage = pathWithoutLocale.startsWith("/auth");

  const isProtectedPage =
    pathWithoutLocale === "/" ||
    pathWithoutLocale.startsWith("/dashboard") ||
    pathWithoutLocale.startsWith("/projects") ||
    pathWithoutLocale.startsWith("/runs") ||
    pathWithoutLocale.startsWith("/test-cases") ||
    pathWithoutLocale.startsWith("/bugs") ||
    pathWithoutLocale.startsWith("/users") ||
    pathWithoutLocale.startsWith("/reports") ||
    pathWithoutLocale.startsWith("/settings") ||
    pathWithoutLocale.startsWith("/ia") ||
    pathWithoutLocale.startsWith("/ai-agent") ||
    pathWithoutLocale.startsWith("/profile");

  if (!token && isProtectedPage && !isAuthPage) {
    const loginUrl = new URL(`/${locale}/auth`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};