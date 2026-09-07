import { z } from "zod";

// 메모 길이 제약은 web 폼도 동일하게 검증해야 하므로 상수로 노출한다.
// (web은 i18n 메시지를 붙인 자체 스키마를 쓰기 때문에 스키마 자체를 재사용할 수 없다)
export const REPORT_MEMO_MIN_LENGTH = 10;
export const REPORT_MEMO_MAX_LENGTH = 2000;

// 요청 입력: 치료사가 작성한 거친 세션 메모
export const generateReportSchema = z.object({
  memo: z
    .string()
    .min(REPORT_MEMO_MIN_LENGTH, "메모를 10자 이상 입력해주세요")
    .max(REPORT_MEMO_MAX_LENGTH),
});

export type GenerateReportDto = z.infer<typeof generateReportSchema>;

// Ollama 출력 검증: LLM 응답(JSON)을 파싱한 뒤 형식을 안전하게 검증한다.
export const ollamaReportSchema = z.object({
  summary: z.string(),
  activities: z.array(z.string()),
  progress: z.string(),
  homework: z.string().nullable(),
  nextGoal: z.string(),
  tone: z.enum(["positive", "neutral", "needs_attention"]),
});

export type OllamaReport = z.infer<typeof ollamaReportSchema>;

// 응답: 날짜는 ISO 문자열로 직렬화한다.
export interface SessionReportResponseDto {
  id: string;
  scheduleId: string;
  rawMemo: string;
  summary: string;
  activities: string[];
  progress: string;
  homework: string | null;
  nextGoal: string;
  tone: string;
  promptVersion: string;
  createdAt: string;
  updatedAt: string;
}
