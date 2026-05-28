import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { THERAPIST_ROUTES, PARENT_ROUTES, AUTH_ROUTES, ROLE_HOME } from '@/shared/lib/routes';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const ACCESS_MAX_AGE = 15 * 60;

function decodeRole(token: string): string | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

async function tryRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.accessToken as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get('eobom_access')?.value;
  const refreshToken = request.cookies.get('eobom_refresh')?.value;

  const isTherapistRoute = THERAPIST_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  const isParentRoute = PARENT_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isProtected = isTherapistRoute || isParentRoute;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (!accessToken && refreshToken) {
    const newAccessToken = await tryRefresh(refreshToken);
    if (newAccessToken) {
      accessToken = newAccessToken;
      const response = isProtected ? NextResponse.next() : NextResponse.next();
      response.cookies.set('eobom_access', newAccessToken, {
        httpOnly: false,
        path: '/',
        maxAge: ACCESS_MAX_AGE,
        sameSite: 'lax',
      });
      const role = decodeRole(newAccessToken);
      if (role) {
        if (isAuthRoute) {
          const dest = role === 'THERAPIST' ? ROLE_HOME.THERAPIST : ROLE_HOME.PARENT;
          const redirect = NextResponse.redirect(new URL(dest, request.url));
          redirect.cookies.set('eobom_access', newAccessToken, {
            httpOnly: false,
            path: '/',
            maxAge: ACCESS_MAX_AGE,
            sameSite: 'lax',
          });
          return redirect;
        }
        if (isTherapistRoute && role !== 'THERAPIST') {
          return NextResponse.redirect(new URL(ROLE_HOME.PARENT, request.url));
        }
        if (isParentRoute && role !== 'PARENT') {
          return NextResponse.redirect(new URL(ROLE_HOME.THERAPIST, request.url));
        }
      }
      return response;
    }
  }

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken) {
    const role = decodeRole(accessToken);

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
    '/schedules/:path*',
    '/home/:path*',
    '/schedule/:path*',
    '/notifications/:path*',
    '/login',
    '/register',
    '/verify-email',
  ],
};
