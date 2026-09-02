// next-intl의 useTranslations/getTranslations가 반환하는 번역기와 호출 시그니처가 호환되는
// 최소 타입 — Server Component가 상위 페이지로부터 t를 prop으로 전달받을 때 사용한다.
//
// prop 설계 규칙:
// - 분기 없이 정적 문구 하나만 표시하는 리프 컴포넌트는 이미 번역된 문자열(`xxxLabel: string`)을 받는다
//   (예: JoinCodeCard.label, ScheduleDetailView.statusLabel, SessionRow.todayLabel).
// - 상태값에 따라 번역 키를 동적으로 골라야 하거나 여러 키를 조합해야 하는 컴포넌트는
//   이 Translate 함수 자체를 받는다 (예: InviteCodeRow, MemberRow, ChildCard).
export type Translate = (key: string, values?: Record<string, string | number>) => string;
