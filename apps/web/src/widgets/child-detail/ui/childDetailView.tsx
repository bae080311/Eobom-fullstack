import type { ReactNode } from 'react';
import Link from 'next/link';
import type { ChildResponseDto } from '@eobom/shared';
import { formatKoreanAge, formatNextSessionLabel, formatBirthDateLabel } from '@/entities/child';
import { DetailRow } from '@/entities/schedule';
import { IconArrowLeft, IconButton, IconCalendar, IconClock, IconUser } from '@/shared/ui';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  child: ChildResponseDto;
  backHref: string;
  footer: ReactNode;
  inviteCodeAction?: ReactNode;
  // 페이지(Server Component)에서 getTranslations('entities.child')로 미리 구한 번역기.
  t: Translate;
  // 페이지(Server Component)에서 getTranslations('widgets.childDetail')로 미리 구한 번역기.
  tWidget: Translate;
}

export function ChildDetailView({ child, backHref, footer, inviteCodeAction, t, tWidget }: Props) {
  const age = formatKoreanAge(child.birthDate);
  const birthDateLabel = formatBirthDateLabel(child.birthDate) ?? tWidget('birthDateUnset');

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased pb-28">
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-5 py-3 z-10">
        <Link href={backHref} className="inline-flex" aria-label={tWidget('backAria')}>
          <IconButton label={tWidget('backAria')}>
            <IconArrowLeft size={18} />
          </IconButton>
        </Link>
        <span className="text-body font-bold text-gray-900">{tWidget('pageTitle')}</span>
        <span className="w-9" />
      </div>

      <section className="px-5 mt-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h1 className="text-title font-bold tracking-tighter text-gray-900 m-0">{child.name}</h1>
          {age && <p className="text-body text-gray-600 mt-1 m-0">{age}</p>}
          <div className="mt-3 flex items-center gap-1.5 text-callout font-semibold text-gray-900">
            <IconClock size={15} /> {formatNextSessionLabel(child.nextSessionAt, t)}
          </div>
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title3 font-bold tracking-tighter m-0">
            {tWidget('infoSectionTitle')}
          </h2>
          {inviteCodeAction}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <DetailRow
            icon={<IconCalendar size={16} />}
            label={tWidget('birthDateLabel')}
            value={birthDateLabel}
          />
          <DetailRow
            icon={<IconUser size={16} />}
            label={tWidget('primaryTherapistLabel')}
            value={child.primaryTherapistName ?? tWidget('primaryTherapistUnset')}
          />
        </div>
      </section>

      {child.memo && (
        <section className="px-5 mt-7">
          <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">
            {tWidget('memoSectionTitle')}
          </h2>
          <div className="bg-brand-softer border border-brand-soft rounded-lg p-5 text-body leading-relaxed text-gray-700">
            {child.memo}
          </div>
        </section>
      )}

      {footer}
    </div>
  );
}
