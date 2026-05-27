import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { THERAPIST_ROUTES, PARENT_ROUTES, AUTH_ROUTES, ROLE_HOME } from '@/shared/lib/routes';

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('eobom_access')?.value;

  const isTherapistRoute = THERAPIST_ROUTES.some((p) => pathname.startsWith(p));
  const isParentRoute = PARENT_ROUTES.some((p) => pathname.startsWith(p));
  const isProtected = isTherapistRoute || isParentRoute;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const role = decodeRole(token);

    if (!role && isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role) {
      if (isAuthRoute) {
        const dest = role === 'THERAPIST' ? ROLE_HOME.THERAPIST : ROLE_HOME.PARENT;
        return NextResponse.redirect(new URL(dest, request.url));
      }

      if (isTherapistRoute && role !== 'THERAPIST') {
        return NextResponse.redirect(new URL(ROLE_HOME.PARENT, request.url));
      }
      if (isParentRoute && role !== 'PARENT') {
        return NextResponse.redirect(new URL(ROLE_HOME.THERAPIST, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/home/:path*',
    '/schedule/:path*',
    '/notifications/:path*',
    '/login',
    '/register',
    '/verify-email',
  ],
};
