'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { loginSchema, type LoginDto } from '@eobom/shared';
import { useLogin } from '../model/useAuth';

export function LoginForm() {
  const t = useTranslations('features.auth');
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  return (
    <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
          placeholder="example@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-danger-strong">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
          placeholder={t('passwordPlaceholder')}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-danger-strong">{errors.password.message}</p>
        )}
      </div>

      {error && error.message !== 'EMAIL_NOT_VERIFIED' && (
        <p className="text-sm text-danger-strong bg-danger-soft rounded-xl px-4 py-3">
          {error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
      >
        {isPending ? t('loggingIn') : t('loginButton')}
      </button>

      <p className="text-center text-sm text-gray-600">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-[#3D7A6B] font-medium">
          {t('signupLink')}
        </Link>
      </p>
    </form>
  );
}
