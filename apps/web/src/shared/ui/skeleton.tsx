interface Props {
  className?: string;
}

/** 로딩 중 콘텐츠 자리를 채우는 펄스 플레이스홀더. */
export function Skeleton({ className = '' }: Props) {
  // className에 별도 rounded-* 가 있으면 기본 rounded-lg 를 생략해 클래스 충돌을 막는다.
  const radius = /(^|\s)rounded(-|\s|$)/.test(className) ? '' : 'rounded-lg';
  return <div className={`animate-pulse bg-gray-200 ${radius} ${className}`.trim()} />;
}
