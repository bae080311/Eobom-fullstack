'use client';

import { useState } from 'react';
import type { ScheduleResponseDto } from '@eobom/shared';
import { ScheduleCard, useSchedules } from '@/entities/schedule';
import { formatDateLabel, formatTime } from '@/shared/lib/date';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
] as const;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  const gridEnd = addDays(lastDay, 6 - lastDay.getDay());
  const days: Date[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return days;
}

interface Props {
  initialData?: ScheduleResponseDto[];
}

export function ScheduleCalendarView({ initialData }: Props) {
  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);

  const { data: schedules = [], isFetching } = useSchedules(viewYear, viewMonth, initialData);

  const grid = getMonthGrid(viewYear, viewMonth);

  const sessionDates = new Set(
    schedules.map((s) => startOfDay(new Date(s.startAt)).toDateString()),
  );

  const todaySchedules = schedules
    .filter((s) => startOfDay(new Date(s.startAt)).toDateString() === today.toDateString())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const isToday = selected.toDateString() === today.toDateString();
  const selectedSchedules = schedules
    .filter((s) => startOfDay(new Date(s.startAt)).toDateString() === selected.toDateString())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  return (
    <div className="flex flex-col">
      {/* 오늘 일정 요약 */}
      {todaySchedules.length > 0 && (
        <div className="mx-4 mb-2 rounded-xl bg-brand px-4 py-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-label font-bold text-white/90">오늘 일정</span>
            <span className="text-caption2 font-bold bg-white/20 text-white px-2 py-0.5 rounded-pill">
              {todaySchedules.length}건
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {todaySchedules.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <span className="text-label font-bold text-white tabular-nums w-10 shrink-0">
                  {formatTime(s.startAt)}
                </span>
                <div className="w-px h-3 bg-white/30 shrink-0" />
                <span className="text-label text-white/90 truncate">
                  {s.childName} · {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 월 헤더 */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="이전 달"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-subhead font-bold text-gray-900">
            {viewYear}년 {MONTH_LABELS[viewMonth]}
          </span>
          {isFetching && (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          )}
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="다음 달"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="px-4 grid grid-cols-7 mb-1">
        {DOW_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-caption font-semibold py-1 ${
              i === 0 ? 'text-danger/70' : i === 6 ? 'text-brand/70' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="px-4 grid grid-cols-7 gap-y-0.5">
        {grid.map((day) => {
          const inMonth = day.getMonth() === viewMonth;
          const isDayToday = day.toDateString() === today.toDateString();
          const isSelected = day.toDateString() === selected.toDateString();
          const hasSessions = sessionDates.has(day.toDateString()) && inMonth;
          const isSun = day.getDay() === 0;
          const isSat = day.getDay() === 6;

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelected(startOfDay(day))}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-body2 font-semibold transition-colors ${
                  isSelected
                    ? 'bg-brand text-white'
                    : isDayToday
                      ? 'bg-brand-soft text-brand font-bold'
                      : !inMonth
                        ? 'text-gray-300'
                        : isSun
                          ? 'text-danger/80'
                          : isSat
                            ? 'text-brand/80'
                            : 'text-gray-900'
                }`}
              >
                {day.getDate()}
              </span>
              <span
                className={`w-1 h-1 rounded-full transition-colors ${
                  hasSessions ? (isSelected ? 'bg-white' : 'bg-brand') : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-100 mx-4 mt-3 mb-4" />

      {/* 선택 날짜 일정 */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body font-semibold text-gray-800">
            {isToday ? '오늘' : formatDateLabel(selected.toISOString())}
            {isToday && (
              <span className="text-body font-normal text-gray-400 ml-1.5">
                {formatDateLabel(selected.toISOString())}
              </span>
            )}
          </h2>
          {selectedSchedules.length > 0 && (
            <span className="text-caption2 font-bold bg-brand text-white px-2.5 py-0.5 rounded-pill">
              {selectedSchedules.length}건
            </span>
          )}
        </div>

        {selectedSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-body2 font-medium text-gray-400">예정된 일정이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedSchedules.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
