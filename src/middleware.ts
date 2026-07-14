// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/i18n/config';

const CANONICAL_HOST = 'www.phoenixgym365.com';
const APEX_HOST = 'phoenixgym365.com';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.includes('.') &&
    !pathname.endsWith('.html')
  ) {
    return;
  }

  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Bare apex domain -> canonical www host, permanently, in a single hop
  // (folds the locale-prefix redirect in so we never chain two redirects).
  if (hostname === APEX_HOST) {
    const url = new URL(request.url);
    url.hostname = CANONICAL_HOST;
    if (!pathnameHasLocale) {
      url.pathname = `/${i18n.defaultLocale}${pathname}`;
    }
    return NextResponse.redirect(url, 308);
  }

  const isNonCanonicalHost = hostname !== CANONICAL_HOST;

  if (pathnameHasLocale) {
    const response = NextResponse.next();
    if (isNonCanonicalHost) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }

  const locale = i18n.defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  if (isNonCanonicalHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
