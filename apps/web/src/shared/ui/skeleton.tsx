interface Props {
  className?: string;
}

/** 로딩 중 콘텐츠 자리를 채우는 펄스 플레이스홀더. */
export function Skeleton({ className }: Props) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ''}`} />;
}
