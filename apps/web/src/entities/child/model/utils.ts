import type { ChildResponseDto } from '@eobom/shared';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import type { Child } from './types';

// 만 나이: 생일이 지났으면 (올해-출생연도), 아직이면 -1. KST 기준.
export function formatKoreanAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (isNaN(parsed.getTime())) return null;
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const kstBirth = new Date(parsed.getTime() + 9 * 60 * 60 * 1000);
  let age = kstNow.getUTCFullYear() - kstBirth.getUTCFullYear();
  const monthDiff = kstNow.getUTCMonth() - kstBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && kstNow.getUTCDate() < kstBirth.getUTCDate())) {
    age -= 1;
  }
  return age < 0 ? null : `만 ${age}세`;
}

export function formatNextSessionLabel(nextSessionAt: string | null): string {
  if (!nextSessionAt) return '예정된 일정 없음';
  return `다음 일정 ${formatDateLabel(nextSessionAt)} ${formatTime(nextSessionAt)}`;
}

export function formatBirthDateLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

export function mapChildToChip(dto: ChildResponseDto): Child {
  return {
    id: dto.id,
    name: dto.name,
    age: formatKoreanAge(dto.birthDate) ?? '',
  };
}
