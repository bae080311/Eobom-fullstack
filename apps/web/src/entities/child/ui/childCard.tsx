import Link from 'next/link';
import { IconUser, IconClock } from '@/shared/ui';
import type { ChildResponseDto } from '@eobom/shared';
import { formatKoreanAge, formatNextSessionLabel } from '../model/utils';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  child: ChildResponseDto;
  // 페이지(Server Component)에서 getTranslations('entities.child')로 미리 구한 번역기.
  t: Translate;
}

export function ChildCard({ child, t }: Props) {
  const age = formatKoreanAge(child.birthDate);
  return (
    <Link
      href={`/children/${child.id}`}
      className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 px-4 py-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <IconUser size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-body font-semibold text-gray-900 truncate">{child.name}</span>
          {age && <span className="text-caption text-gray-600">{age}</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-caption text-gray-600">
          <IconClock size={12} />
          {formatNextSessionLabel(child.nextSessionAt, t)}
        </div>
      </div>
    </Link>
  );
}
