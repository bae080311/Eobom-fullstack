import type { ChildResponseDto } from '@eobom/shared';
import { ChildCard } from './childCard';

interface Props {
  items: ChildResponseDto[];
}

export function ChildList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-body">
        담당 아동이 없어요
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 px-5 mt-3">
      {items.map((child) => (
        <ChildCard key={child.id} child={child} />
      ))}
    </div>
  );
}
