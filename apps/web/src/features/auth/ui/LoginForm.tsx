'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginDto } from '@eobom/shared';
import { useLogin } from '../model/useAuth';

export function LoginForm() {
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
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
          placeholder="example@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
          placeholder="비밀번호를 입력하세요"
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {error && error.message !== 'EMAIL_NOT_VERIFIED' && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
      >
        {isPending ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/register" className="text-[#3D7A6B] font-medium">
          회원가입
        </Link>
      </p>
    </form>
  );
}
