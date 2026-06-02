import { describe, it, expect } from 'vitest';
import { THERAPIST_ROUTES, PARENT_ROUTES, COMMON_ROUTES, AUTH_ROUTES, ROLE_HOME } from './routes';

describe('route constants', () => {
  it('THERAPIST_ROUTES includes /dashboard', () => {
    expect(THERAPIST_ROUTES).toContain('/dashboard');
  });

  it('PARENT_ROUTES includes /home and /schedule', () => {
    expect(PARENT_ROUTES).toContain('/home');
    expect(PARENT_ROUTES).toContain('/schedule');
  });

  it('COMMON_ROUTES includes /notifications', () => {
    expect(COMMON_ROUTES).toContain('/notifications');
  });

  it('AUTH_ROUTES includes /login and /register', () => {
    expect(AUTH_ROUTES).toContain('/login');
    expect(AUTH_ROUTES).toContain('/register');
  });

  it('ROLE_HOME maps roles to their home routes', () => {
    expect(ROLE_HOME.THERAPIST).toBe('/dashboard');
    expect(ROLE_HOME.PARENT).toBe('/home');
  });

  it('THERAPIST and PARENT routes do not overlap', () => {
    const overlap = THERAPIST_ROUTES.filter((r) =>
      (PARENT_ROUTES as readonly string[]).includes(r),
    );
    expect(overlap).toHaveLength(0);
  });

  it('auth routes are separate from role routes', () => {
    const allRole = [...THERAPIST_ROUTES, ...PARENT_ROUTES] as string[];
    AUTH_ROUTES.forEach((r) => expect(allRole).not.toContain(r));
  });
});
