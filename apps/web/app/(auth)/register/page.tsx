import type { Metadata } from 'next';

export const metadata: Metadata = { title: '회원가입' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-gray-500 text-sm">치료사 또는 학부모로 가입하세요</p>
        </div>

        {/* Phase 2에서 실제 회원가입 폼 구현 */}
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
          회원가입 폼은 Phase 2에서 구현됩니다.
        </div>
      </div>
    </main>
  );
}
