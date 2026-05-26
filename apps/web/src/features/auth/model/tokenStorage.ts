const ACCESS_KEY = 'eobom_access';
const REFRESH_KEY = 'eobom_refresh';

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const tokenStorage = {
  getAccess: () => getCookie(ACCESS_KEY),
  getRefresh: () => getCookie(REFRESH_KEY),

  setTokens(accessToken: string, refreshToken: string) {
    setCookie(ACCESS_KEY, accessToken, 15 * 60);
    setCookie(REFRESH_KEY, refreshToken, 7 * 24 * 3600);
  },

  setAccess(accessToken: string) {
    setCookie(ACCESS_KEY, accessToken, 15 * 60);
  },

  clear() {
    deleteCookie(ACCESS_KEY);
    deleteCookie(REFRESH_KEY);
  },
};
