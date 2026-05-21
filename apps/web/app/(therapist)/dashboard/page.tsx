import type { Metadata } from 'next';

export const metadata: Metadata = { title: '치료사 대시보드' };

export default function TherapistDashboardPage() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold text-gray-900">치료사 대시보드</h1>
      <p className="mt-2 text-gray-500 text-sm">Phase 3에서 구현됩니다.</p>
    </main>
  );
}
