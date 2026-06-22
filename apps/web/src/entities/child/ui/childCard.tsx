import { IconUser, IconClock } from '@/shared/ui';
import type { ChildResponseDto } from '@eobom/shared';
import { formatKoreanAge, formatNextSessionLabel } from '../model/utils';

interface Props {
  child: ChildResponseDto;
}

export function ChildCard({ child }: Props) {
  const age = formatKoreanAge(child.birthDate);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 px-4 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <IconUser size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-body font-semibold text-gray-900 truncate">{child.name}</span>
          {age && <span className="text-caption text-gray-500">{age}</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-caption text-gray-500">
          <IconClock size={12} />
          {formatNextSessionLabel(child.nextSessionAt)}
        </div>
      </div>
    </div>
  );
}
