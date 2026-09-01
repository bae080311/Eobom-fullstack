export function parseJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}

export function getJwtRole(token: string): string | null {
  return parseJwt<{ role?: string }>(token)?.role ?? null;
}

export function isJwtExpired(token: string): boolean {
  const payload = parseJwt<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}
