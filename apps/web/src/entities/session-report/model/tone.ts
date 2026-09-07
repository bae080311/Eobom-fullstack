import koMessages from '../../../../messages/ko.json';
import { SESSION_REPORT_TONES, type SessionReportTone } from './types';

// 톤 라벨은 messages/ko.json의 entities.sessionReport.tone에서 톤 값을 키로 그대로 조회한다.
// satisfies는 모든 톤 값에 대응하는 메시지 키가 있는지 컴파일 타임에 검증한다 —
// entities/schedule의 SCHEDULE_STATUS_LABELS_KO와 동일한 패턴.
export const SESSION_REPORT_TONE_LABELS_KO = koMessages.entities.sessionReport
  .tone satisfies Record<SessionReportTone, string>;

export const SESSION_REPORT_TONE_COLOR: Record<SessionReportTone, string> = {
  positive: 'bg-brand-soft text-brand-ink',
  neutral: 'bg-gray-100 text-gray-700',
  needs_attention: 'bg-yellow-100 text-yellow-800',
};

const KNOWN_TONES: readonly string[] = SESSION_REPORT_TONES;

// LLM이 생성한 값이라 계약을 벗어난 문자열이 올 수 있다 — 화면이 깨지지 않도록 neutral로 흡수한다.
export function resolveSessionReportTone(tone: string): SessionReportTone {
  return KNOWN_TONES.includes(tone) ? (tone as SessionReportTone) : 'neutral';
}
