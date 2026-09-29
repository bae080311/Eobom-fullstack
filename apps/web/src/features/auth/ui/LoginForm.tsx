'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { loginSchema, type LoginDto } from '@eobom/shared';
import { useLogin } from '../model/useAuth';

// 토큰을 쓴다 — 이전에는 `#3D7A6B` 를 세 군데에 직접 박아 두어 brand 색을 바꿔도
// 이 화면만 옛 색으로 남았다. 타입도 프로젝트 스케일(body/label)을 따른다.
const FIELD =
  'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-body text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand focus-visible:shadow-focus';

export function LoginForm() {
  const t = useTranslations('features.auth');
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  function onSubmit(data: LoginDto) {
    login(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-label font-semibold text-gray-700">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          {...register('email')}
          className={FIELD}
          placeholder="example@email.com"
        />
        {errors.email && (
          <p role="alert" className="text-body2 text-danger-strong m-0">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-label font-semibold text-gray-700">
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          {...register('password')}
          className={FIELD}
          placeholder={t('passwordPlaceholder')}
        />
        {errors.password && (
          <p role="alert" className="text-body2 text-danger-strong m-0">
            {errors.password.message}
          </p>
        )}
      </div>

      {error && error.message !== 'EMAIL_NOT_VERIFIED' && (
        <p
          role="alert"
          className="text-body text-danger-strong bg-danger-soft rounded-[10px] px-4 py-3 m-0"
        >
          {error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-[10px] bg-brand py-3.5 text-callout font-bold text-white border-0 cursor-pointer font-sans transition-colors hover:bg-brand-hover active:bg-brand-press disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-focus"
      >
        {isPending ? t('loggingIn') : t('loginButton')}
      </button>

      <p className="text-body text-gray-600 m-0">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          className="font-bold text-brand underline underline-offset-4 decoration-gray-300 hover:decoration-brand focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
        >
          {t('signupLink')}
        </Link>
      </p>
    </form>
  );
}
