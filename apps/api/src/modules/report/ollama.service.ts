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

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';

/** RFC 1918 사설 대역 + 루프백. */
const PRIVATE_IPV4 = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;

/**
 * 이 URL이 우리가 직접 운영하는 범위 안인지 판정한다.
 *
 * 허용: 루프백 · RFC 1918 사설 대역 · `.local`/`.internal` · 점 없는 호스트명
 * (docker compose 서비스명, 쿠버네티스 클러스터 내부 이름). 공개 도메인은 점을
 * 포함하므로 마지막 조건으로 새지 않는다.
 */
export function isSelfHostedOllamaUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  // 스킴을 먼저 본다. `new URL('localhost:11434')` 는 던지지 않고 **`localhost:` 를
  // 스킴으로** 읽어 hostname 을 빈 문자열로 만든다. 그 빈 값은 점을 포함하지 않아
  // 아래 마지막 조건(내부 호스트명)을 그대로 통과한다.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.hostname === '') return false;

  // IPv6 리터럴은 `new URL`이 대괄호를 남긴다.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host === '::1') return true;
  if (PRIVATE_IPV4.test(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  return !host.includes('.');
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  /**
   * 세션 기록이 나갈 수 있는 곳을 자체 운영 범위로 못박는다.
   *
   * `OLLAMA_URL`은 환경변수라 아무 호스트나 가리킬 수 있고, 그 값이 외부를 향하면
   * 치료 세션 메모 **원문**이 제3자에게 전송된다. 개인정보처리방침 제6조는 "서비스가
   * 직접 운영하는 서버에서 실행되며 외부 인공지능 사업자에게 전송되지 않는다"고
   * 고지하고 있으므로, 검증이 없으면 오설정 하나로 고지가 거짓이 된다.
   *
   * **옵트인 탈출구를 두지 않는다** — 두는 순간 그것이 방침을 조용히 깨는 경로가
   * 된다. 외부 엔드포인트를 정말 써야 한다면 방침(`app.privacy` 제6조·제8조·제9조)을
   * 먼저 고쳐야 한다. 같은 이유로 `apps/mobile`도 로컬이 아닌 http 주소를 `cap sync`
   * 단계에서 실패시킨다.
   */
  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('OLLAMA_URL') ?? DEFAULT_OLLAMA_URL;
    this.model = config.get<string>('OLLAMA_MODEL') ?? DEFAULT_OLLAMA_MODEL;

    if (!isSelfHostedOllamaUrl(this.baseUrl)) {
      throw new Error(
        `OLLAMA_URL(${this.baseUrl})이 자체 운영 범위를 벗어납니다. ` +
          '세션 기록 원문이 외부로 전송되어 개인정보처리방침 제6조의 고지와 어긋납니다. ' +
          '루프백·사설 대역·내부 호스트명만 허용합니다.',
      );
    }
  }

  async generateReport(memo: string): Promise<OllamaReport> {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000), // 로컬 LLM 무한 대기로 인한 커넥션 고갈 방지
        body: JSON.stringify({
          model: this.model,
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
