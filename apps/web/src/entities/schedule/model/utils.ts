import type { ScheduleResponseDto } from '@eobom/shared';
import {
  formatDateLabel,
  formatTime,
  getKSTWeekdayShort,
  toKSTDateString,
} from '@/shared/lib/date';
import type { UpcomingSession, WeekDay, NextSession, SessionStatus } from './types';

const DOW_KO = ['월', '화', '수', '목', '금', '토', '일'];

function getKSTDayOfMonth(iso: string | Date): number {
  const dateStr = toKSTDateString(iso);
  return parseInt(dateStr.slice(8, 10), 10);
}

function getSessionStatus(startAt: string, now: Date): SessionStatus {
  const startDateStr = toKSTDateString(startAt);
  const nowDateStr = toKSTDateString(now);
  if (startDateStr === nowDateStr) return 'today';
  return startDateStr > nowDateStr ? 'upcoming' : 'past';
}

function formatTimeUntil(startAt: string, now: Date): string {
  const diffMs = new Date(startAt).getTime() - now.getTime();
  if (diffMs <= 0) return '';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}분 뒤`;
  if (minutes === 0) return `${hours}시간 뒤`;
  return `${hours}시간 ${minutes}분 뒤`;
}

export function mapScheduleToUpcoming(dto: ScheduleResponseDto, now: Date): UpcomingSession {
  return {
    id: dto.id,
    day: getKSTWeekdayShort(dto.startAt),
    date: String(getKSTDayOfMonth(dto.startAt)),
    time: formatTime(dto.startAt),
    type: dto.title,
    child: dto.childName,
    therapist: dto.therapistName ?? '',
    status: getSessionStatus(dto.startAt, now),
  };
}

export function mapScheduleToNextSession(dto: ScheduleResponseDto, now: Date): NextSession {
  const status = getSessionStatus(dto.startAt, now);
  const dateLabel =
    status === 'today' ? `오늘 ${formatDateLabel(dto.startAt)}` : formatDateLabel(dto.startAt);

  return {
    childName: dto.childName,
    therapistName: dto.therapistName ?? '',
    type: dto.title,
    dateLabel,
    timeLabel: formatTime(dto.startAt),
    timeUntil: formatTimeUntil(dto.startAt, now),
  };
}

export function buildWeekDays(
  weekStart: Date,
  schedules: ScheduleResponseDto[],
  now: Date,
): WeekDay[] {
  const scheduleDates = new Set(schedules.map((s) => toKSTDateString(s.startAt)));
  const todayStr = toKSTDateString(now);

  return DOW_KO.map((dow, i) => {
    const day = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = toKSTDateString(day);
    return {
      dow,
      num: getKSTDayOfMonth(day),
      hasSession: scheduleDates.has(dateStr),
      today: dateStr === todayStr,
    };
  });
}
