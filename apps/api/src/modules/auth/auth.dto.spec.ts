import { describe, it, expect } from 'vitest';
import {
  sendVerificationCodeSchema,
  verifyCodeSchema,
  signupSchema,
  loginSchema,
  signupOrganizationSchema,
} from '@eobom/shared';

describe('sendVerificationCodeSchema', () => {
  it('accepts valid email', () => {
    expect(sendVerificationCodeSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects invalid email format', () => {
    expect(sendVerificationCodeSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(sendVerificationCodeSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejects missing email field', () => {
    expect(sendVerificationCodeSchema.safeParse({}).success).toBe(false);
  });
});

describe('verifyCodeSchema', () => {
  it('accepts valid 6-digit code', () => {
    expect(verifyCodeSchema.safeParse({ email: 'a@b.com', code: '123456' }).success).toBe(true);
  });

  it('rejects code shorter than 6 digits', () => {
    expect(verifyCodeSchema.safeParse({ email: 'a@b.com', code: '12345' }).success).toBe(false);
  });

  it('rejects code longer than 6 digits', () => {
    expect(verifyCodeSchema.safeParse({ email: 'a@b.com', code: '1234567' }).success).toBe(false);
  });

  it('rejects missing code', () => {
    expect(verifyCodeSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
});

describe('signupOrganizationSchema', () => {
  it('accepts CREATE mode with a name', () => {
    expect(signupOrganizationSchema.safeParse({ mode: 'CREATE', name: 'Clinic' }).success).toBe(
      true,
    );
  });

  it('rejects CREATE mode with empty name', () => {
    expect(signupOrganizationSchema.safeParse({ mode: 'CREATE', name: '' }).success).toBe(false);
  });

  it('accepts JOIN mode with a joinCode', () => {
    expect(signupOrganizationSchema.safeParse({ mode: 'JOIN', joinCode: 'ABCD1234' }).success).toBe(
      true,
    );
  });

  it('rejects JOIN mode with empty joinCode', () => {
    expect(signupOrganizationSchema.safeParse({ mode: 'JOIN', joinCode: '' }).success).toBe(false);
  });

  it('rejects unknown mode', () => {
    expect(signupOrganizationSchema.safeParse({ mode: 'UNKNOWN' }).success).toBe(false);
  });
});

describe('signupSchema', () => {
  const base = {
    emailVerifiedToken: 'eyJ.tok',
    password: 'securepass',
    name: 'Alice',
    role: 'PARENT',
  };

  it('accepts valid PARENT signup without organization', () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });

  it('accepts valid THERAPIST signup with CREATE org', () => {
    const dto = { ...base, role: 'THERAPIST', organization: { mode: 'CREATE', name: 'Clinic A' } };
    expect(signupSchema.safeParse(dto).success).toBe(true);
  });

  it('accepts valid THERAPIST signup with JOIN org', () => {
    const dto = {
      ...base,
      role: 'THERAPIST',
      organization: { mode: 'JOIN', joinCode: 'ABCD1234' },
    };
    expect(signupSchema.safeParse(dto).success).toBe(true);
  });

  it('accepts THERAPIST signup without organization (optional)', () => {
    expect(signupSchema.safeParse({ ...base, role: 'THERAPIST' }).success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    expect(signupSchema.safeParse({ ...base, password: 'short' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(signupSchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });

  it('rejects unknown role', () => {
    expect(signupSchema.safeParse({ ...base, role: 'ADMIN' }).success).toBe(false);
  });

  it('rejects missing emailVerifiedToken', () => {
    const { password, name, role } = base;
    expect(signupSchema.safeParse({ password, name, role }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'anypass' }).success).toBe(true);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'notanemail', password: 'pass' }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});
