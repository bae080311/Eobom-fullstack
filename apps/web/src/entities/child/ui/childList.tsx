import type { ChildResponseDto } from '@eobom/shared';
import { ChildCard } from './childCard';

type Translate = (key: string, values?: Record<string, string | number>) => string;

interface Props {
  items: ChildResponseDto[];
  // 페이지(Server Component)에서 getTranslations('entities.child')로 미리 구한 번역기.
  t: Translate;
}

export function ChildList({ items, t }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-600 text-body">
        {t('empty')}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 px-5 mt-3">
      {items.map((child) => (
        <ChildCard key={child.id} child={child} t={t} />
      ))}
    </div>
  );
}
