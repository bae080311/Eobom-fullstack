import type { ReactNode } from 'react';

interface Props {
  joinCode: string;
  actions?: ReactNode;
  // 페이지(Server Component)에서 getTranslations('entities.organization')로 미리 구한 라벨.
  label: string;
}

export function JoinCodeCard({ joinCode, actions, label }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
      <div className="min-w-0">
        <p className="text-label font-semibold text-gray-600 m-0">{label}</p>
        <p className="mt-1 text-title3 font-bold tracking-wide text-gray-900 m-0 truncate">
          {joinCode}
        </p>
      </div>
      {actions}
    </div>
  );
}
