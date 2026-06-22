import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  THERAPIST_ROUTES,
  PARENT_ROUTES,
  COMMON_ROUTES,
  AUTH_ROUTES,
  ROLE_HOME,
} from '@/shared/lib/routes';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const ACCESS_MAX_AGE = 15 * 60;
const ACCESS_COOKIE = {
  httpOnly: false,
  path: '/',
  maxAge: ACCESS_MAX_AGE,
  sameSite: 'lax',
} as const;

function decodeRole(token: string): string | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
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

function getRoleRedirectPath(role: string, pathname: string): string | null {
  const isTherapist = THERAPIST_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isParent = PARENT_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuth = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isAuth) return role === 'THERAPIST' ? ROLE_HOME.THERAPIST : ROLE_HOME.PARENT;
  if (isTherapist && role !== 'THERAPIST') return ROLE_HOME.PARENT;
  if (isParent && role !== 'PARENT') return ROLE_HOME.THERAPIST;
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get('eobom_access')?.value;
  const refreshToken = request.cookies.get('eobom_refresh')?.value;

  const isProtected = [...THERAPIST_ROUTES, ...PARENT_ROUTES, ...COMMON_ROUTES].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const isExpired = accessToken ? isTokenExpired(accessToken) : true;

  if (isExpired && refreshToken) {
    const newToken = await tryRefresh(refreshToken);
    if (newToken) {
      accessToken = newToken;
      const role = decodeRole(newToken);
      const redirectPath = role ? getRoleRedirectPath(role, pathname) : null;
      const response = redirectPath
        ? NextResponse.redirect(new URL(redirectPath, request.url))
        : NextResponse.next();
      response.cookies.set('eobom_access', newToken, ACCESS_COOKIE);
      return response;
    }
    accessToken = undefined;
  } else if (isExpired) {
    accessToken = undefined;
  }

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken) {
    const role = decodeRole(accessToken);
    if (!role && isProtected) return NextResponse.redirect(new URL('/login', request.url));
    if (role) {
      const redirectPath = getRoleRedirectPath(role, pathname);
      if (redirectPath) return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/schedules/:path*',
    '/children/:path*',
    '/home/:path*',
    '/schedule/:path*',
    '/notifications/:path*',
    '/me/:path*',
    '/login',
    '/register',
    '/verify-email',
  ],
};
