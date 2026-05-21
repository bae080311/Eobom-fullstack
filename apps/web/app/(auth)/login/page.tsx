import type { Metadata } from 'next';

export const metadata: Metadata = { title: '로그인' };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-gray-500 text-sm">이어봄에 로그인하세요</p>
        </div>

        {/* Phase 2에서 실제 로그인 폼 구현 */}
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
          로그인 폼은 Phase 2에서 구현됩니다.
        </div>
      </div>
    </main>
  );
}
