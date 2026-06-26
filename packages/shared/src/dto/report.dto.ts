import { z } from "zod";

// 요청 입력: 치료사가 작성한 거친 세션 메모
export const generateReportSchema = z.object({
  memo: z.string().min(10, "메모를 10자 이상 입력해주세요").max(2000),
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
