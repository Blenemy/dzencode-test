import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { AuthCookie } from '@dzen/shared';
import { routing } from './i18n/routing';

const handleI18n = createMiddleware(routing);

const GUEST_ONLY = ['/login', '/register'];

function splitLocale(pathname: string): { prefix: string; path: string } {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return { prefix: `/${locale}`, path: pathname.slice(locale.length + 1) || '/' };
    }
  }
  return { prefix: '', path: pathname };
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { prefix, path } = splitLocale(pathname);

  const hasAccess = request.cookies.has(AuthCookie.Access);
  const hasSession = hasAccess || request.cookies.has(AuthCookie.SessionHint);
  const guestOnly = GUEST_ONLY.some((route) => path === route || path.startsWith(`${route}/`));

  if (guestOnly && hasAccess) {
    return NextResponse.redirect(new URL(`${prefix}/orders`, request.url));
  }

  if (!guestOnly && !hasSession) {
    const login = new URL(`${prefix}/login`, request.url);
    if (path !== '/') login.searchParams.set('next', `${path}${search}`);
    return NextResponse.redirect(login);
  }

  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!api|uploads|_next|_vercel|healthz|.*\\..*).*)'],
};
