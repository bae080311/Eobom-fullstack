import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-primary-500">이어봄</h1>
          <p className="mt-3 text-gray-500 text-lg">치료 일정을 함께 확인하세요</p>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          언어치료사와 학부모가 치료 일정을 실시간으로 공유하고, 일정 변경을 빠르게 확인할 수 있는
          서비스입니다.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-6 border border-primary-500 text-primary-500 rounded-xl font-medium hover:bg-primary-50 transition-colors"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
