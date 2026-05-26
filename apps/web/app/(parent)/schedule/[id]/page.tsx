import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailRow, MOCK_SCHEDULES } from '@/entities/schedule';
import { IconArrowLeft, IconMoreHorizontal, IconClock, IconUser, IconMapPin, IconCheck, IconRefresh, IconButton } from '@/shared/ui';
import { NextSessionHero } from '@/widgets/next-session-hero';

export const metadata: Metadata = { title: '일정 상세' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = MOCK_SCHEDULES[id];
  if (!session) notFound();

  const heroSession = {
    childName:     session.child,
    therapistName: session.therapist,
    dateLabel:     session.dateLabel,
    timeLabel:     session.timeLabel,
    timeUntil:     session.status === 'today' ? '진행 중' : session.dateLabel,
    location:      `${session.room} · ${session.location}`,
    type:          session.type,
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased pb-28">

      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-5 py-3 z-10">
        <Link href="/schedule" className="inline-flex" aria-label="뒤로">
          <IconButton label="뒤로">
            <IconArrowLeft size={18} />
          </IconButton>
        </Link>
        <span className="text-body font-bold text-gray-900">치료 일정 상세</span>
        <IconButton label="더보기">
          <IconMoreHorizontal size={18} />
        </IconButton>
      </div>

      <div className="mt-5">
        <NextSessionHero session={heroSession} />
      </div>

      <section className="px-5 mt-7">
        <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">치료 정보</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <DetailRow icon={<IconUser size={16} />}   label="담당 치료사" value={session.therapist} />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <DetailRow icon={<IconMapPin size={16} />} label="장소"        value={`${session.room} · ${session.location}`} />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <DetailRow icon={<IconClock size={16} />}  label="치료 시간"   value={`${session.timeLabel} (${session.duration})`} />
        </div>
      </section>

      {session.notes && (
        <section className="px-5 mt-7">
          <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">이전 회기 메모</h2>
          <div className="bg-brand-softer border border-brand-soft rounded-lg p-5 text-body leading-relaxed text-gray-700">
            {session.notes}
            <div className="mt-3 text-body2 text-gray-400">
              {session.dateLabel} · {session.therapist}
            </div>
          </div>
        </section>
      )}

      <div className="fixed bottom-0 inset-x-0 px-5 py-3 pb-[30px] bg-white/90 backdrop-blur-xl border-t border-gray-200 flex gap-2 z-50">
        <button className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans">
          <IconRefresh size={16} /> 변경 요청
        </button>
        <button className="flex-[2] bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans">
          <IconCheck size={16} /> 일정 확인
        </button>
      </div>
    </div>
  );
}
