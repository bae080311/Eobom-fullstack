export const THERAPIST_ROUTES = ['/dashboard', '/schedules', '/children'] as const;
export const PARENT_ROUTES = ['/home', '/schedule'] as const;
export const COMMON_ROUTES = ['/notifications', '/me'] as const;
export const AUTH_ROUTES = ['/login', '/register', '/verify-email'] as const;

export const ROLE_HOME = {
  THERAPIST: '/dashboard',
  PARENT: '/home',
} as const;
