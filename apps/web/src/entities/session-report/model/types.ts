// API의 SessionReportResponseDto.tone은 string이다 (DB에 자유 문자열로 저장되고 고정 enum이 아니다 —
// 레이어 3 §3.3 참고). 표시 단계에서만 아래 세 값으로 좁히고, 벗어나면 neutral로 폴백한다.
export const SESSION_REPORT_TONES = ['positive', 'neutral', 'needs_attention'] as const;

export type SessionReportTone = (typeof SESSION_REPORT_TONES)[number];
