import type { Metadata } from 'next';
import { RegisterForm } from '../../../src/features/auth';

export const metadata: Metadata = { title: '회원가입' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-gray-500 text-sm">치료사 또는 학부모로 가입하세요</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
