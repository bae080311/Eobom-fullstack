import type { ReactNode } from 'react';
import Link from 'next/link';
import type { ChildResponseDto } from '@eobom/shared';
import { formatKoreanAge, formatNextSessionLabel, formatBirthDateLabel } from '@/entities/child';
import { DetailRow } from '@/entities/schedule';
import { IconArrowLeft, IconButton, IconCalendar, IconClock } from '@/shared/ui';

interface Props {
  child: ChildResponseDto;
  backHref: string;
  footer: ReactNode;
}

export function ChildDetailView({ child, backHref, footer }: Props) {
  const age = formatKoreanAge(child.birthDate);
  const birthDateLabel = formatBirthDateLabel(child.birthDate) ?? '등록되지 않음';

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased pb-28">
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-5 py-3 z-10">
        <Link href={backHref} className="inline-flex" aria-label="뒤로">
          <IconButton label="뒤로">
            <IconArrowLeft size={18} />
          </IconButton>
        </Link>
        <span className="text-body font-bold text-gray-900">아동 상세</span>
        <span className="w-9" />
      </div>

      <section className="px-5 mt-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h1 className="text-title font-bold tracking-tighter text-gray-900 m-0">{child.name}</h1>
          {age && <p className="text-body text-gray-600 mt-1 m-0">{age}</p>}
          <div className="mt-3 flex items-center gap-1.5 text-callout font-semibold text-gray-900">
            <IconClock size={15} /> {formatNextSessionLabel(child.nextSessionAt)}
          </div>
        </div>
      </section>

      <section className="px-5 mt-7">
        <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">아동 정보</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <DetailRow icon={<IconCalendar size={16} />} label="생년월일" value={birthDateLabel} />
        </div>
      </section>

      {child.memo && (
        <section className="px-5 mt-7">
          <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">메모</h2>
          <div className="bg-brand-softer border border-brand-soft rounded-lg p-5 text-body leading-relaxed text-gray-700">
            {child.memo}
          </div>
        </section>
      )}

      {footer}
    </div>
  );
}
