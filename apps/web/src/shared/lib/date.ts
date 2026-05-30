const KST_TZ = 'Asia/Seoul';

export function formatTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = (parts.find((p) => p.type === 'hour')?.value ?? '00').replace('24', '00');
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatDateLabel(iso: string): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TZ,
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(new Date(iso));
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  return `${month}월 ${day}일 (${weekday})`;
}

export function toKSTDateString(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function getKSTStartOfDay(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
  return new Date(Date.UTC(year, month, day) - 9 * 60 * 60 * 1000);
}

export function getKSTWeekStart(date: Date = new Date()): Date {
  const todayStart = getKSTStartOfDay(date);
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const utcDay = kstDate.getUTCDay();
  const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  return new Date(todayStart.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
}
