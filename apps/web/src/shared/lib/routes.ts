export const THERAPIST_ROUTES = ['/dashboard'] as const;
export const PARENT_ROUTES = ['/home', '/schedule', '/notifications'] as const;
export const AUTH_ROUTES = ['/login', '/register', '/verify-email'] as const;

export const ROLE_HOME = {
  THERAPIST: '/dashboard',
  PARENT: '/home',
} as const;
