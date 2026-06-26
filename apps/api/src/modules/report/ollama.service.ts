import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ollamaReportSchema } from '@eobom/shared';
import type { OllamaReport } from '@eobom/shared';

const SYSTEM_PROMPT = `당신은 언어치료 전문가의 세션 기록을 학부모가 이해할 수 있는 따뜻한 한국어로 변환하는 도우미입니다.

규칙:
1. 전문 용어를 일상어로 바꾸세요. 예: "/ㄹ/ 조음 훈련" → "ㄹ 발음 연습"
2. 부정적 표현을 긍정적으로 프레이밍하세요.
3. 반드시 아래 JSON 형식으로만 응답하세요.

{
  "summary": "오늘 세션 한 줄 요약",
  "activities": ["활동1", "활동2"],
  "progress": "발달 상황 (2-3문장)",
  "homework": "가정 연습 내용 또는 null",
  "nextGoal": "다음 세션 목표",
  "tone": "positive | neutral | needs_attention"
}`;

interface OllamaChatResponse {
  message?: { content?: string };
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor(private readonly config: ConfigService) {}

  async generateReport(memo: string): Promise<OllamaReport> {
    const baseUrl = this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:7b';

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000), // 로컬 LLM 무한 대기로 인한 커넥션 고갈 방지
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json', // Ollama 구조화 출력 강제
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: memo },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama responded with status ${res.status}`);
      }

      const json = (await res.json()) as OllamaChatResponse;
      const content = json.message?.content;
      if (!content) {
        throw new Error('Ollama response missing message content');
      }

      const parsed: unknown = JSON.parse(content);
      return ollamaReportSchema.parse(parsed); // 형식 검증
    } catch (err) {
      this.logger.error(`generateReport failed: ${String(err)}`);
      throw new ServiceUnavailableException('리포트 생성 서비스에 연결할 수 없습니다.');
    }
  }
}
