import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-title font-bold tracking-tighter text-gray-900 mt-5">
        찾을 수 없는 페이지예요
      </h1>
      <p className="text-body text-gray-600 mt-2">주소가 바뀌었거나 삭제된 일정일 수 있어요.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-body font-semibold text-white no-underline"
      >
        홈으로 가기
      </Link>
    </div>
  );
}
