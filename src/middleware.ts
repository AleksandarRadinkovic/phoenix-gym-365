// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/i18n/config';

const CANONICAL_HOST = 'www.phoenixgym365.com';
const APEX_HOST = 'phoenixgym365.com';
const DASHBOARD_HOST = 'app.phoenixgym365.com';
const DASHBOARD_AUTH_COOKIE = 'gym_dash_auth';

// Matches common bot/scanner probe paths (.php, .env, wp-*, adminer, credentials, ...)
// so they get a clean 404 instead of falling through to the [lang] dynamic route.
const SUSPICIOUS_PATH =
  /\.(php|env|sql|bak|log|git)(\.|$)|wp-(admin|login|content|includes|json)|adminer|phpmyadmin|swagger|credentials?|config\.json|xmlrpc|\.aws|\.ssh/i;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (SUSPICIOUS_PATH.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (
    pathname.includes('.') &&
    !pathname.endsWith('.html')
  ) {
    return;
  }

  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

  // app.phoenixgym365.com -> internal staff dashboard, completely separate from
  // the public marketing site. No locale routing here, just a simple password gate.
  // /dashboard/* is also gated the same way on any other host (e.g. preview deployments).
  const isDashboardPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  if (hostname === DASHBOARD_HOST || isDashboardPath) {
    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    const isAuthed =
      !!expectedPassword &&
      request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value === expectedPassword;
    const isLoginPath = pathname === '/dashboard/login';

    if (pathname === '/') {
      const url = new URL(request.url);
      url.pathname = isAuthed ? '/dashboard' : '/dashboard/login';
      return NextResponse.rewrite(url);
    }

    if (!isAuthed && !isLoginPath) {
      const url = new URL(request.url);
      url.pathname = '/dashboard/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

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
