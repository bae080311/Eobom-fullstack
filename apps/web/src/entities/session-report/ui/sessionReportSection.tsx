import type { ReactNode } from 'react';

interface Props {
  // 정적 문구 하나만 표시하는 리프라 번역된 문자열을 받는다 (레이어 6 §6.9).
  title: string;
  // 제목 우측 액션. 학부모는 열람만 하므로 비어 있고, 치료사 화면에서만 작성 버튼이 들어온다.
  action?: ReactNode;
  children: ReactNode;
}

export function SessionReportSection({ title, action, children }: Props) {
  return (
    <section className="px-5 mt-7">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-title3 font-bold tracking-tighter m-0">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
