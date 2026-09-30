import { describe, it, expect } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { isSelfHostedOllamaUrl, OllamaService } from './ollama.service.js';

/** `OLLAMA_URL`만 바꿔가며 생성자를 때리기 위한 최소 ConfigService. */
function configWith(ollamaUrl: string | undefined): ConfigService {
  return {
    get: (key: string) => (key === 'OLLAMA_URL' ? ollamaUrl : undefined),
  } as unknown as ConfigService;
}

describe('isSelfHostedOllamaUrl', () => {
  it.each([
    'http://localhost:11434',
    'http://127.0.0.1:11434',
    'http://[::1]:11434',
    'http://10.0.3.7:11434',
    'http://192.168.0.12:11434',
    'http://172.16.0.1:11434',
    'http://172.31.255.254:11434',
    'http://ollama:11434', // docker compose 서비스명
    'http://gpu-box.local:11434',
    'http://ollama.internal:11434',
    'https://ollama:11434',
  ])('자체 운영 범위인 %s 를 허용한다', (url) => {
    expect(isSelfHostedOllamaUrl(url)).toBe(true);
  });

  it.each([
    'https://api.openai.com',
    'https://ollama.com',
    'http://ollama.example.com:11434',
    'https://1.2.3.4:11434',
    // 사설 대역 경계 바로 바깥 — 172.16~31 만 사설이다
    'http://172.15.0.1:11434',
    'http://172.32.0.1:11434',
  ])('외부 엔드포인트인 %s 를 거부한다', (url) => {
    expect(isSelfHostedOllamaUrl(url)).toBe(false);
  });

  it.each(['', 'localhost:11434', 'not a url', '11434'])(
    'URL 로 파싱되지 않는 %s 를 거부한다',
    (raw) => {
      // 스킴 없는 값은 `new URL` 이 던진다. 통과시키면 fetch 가 런타임에 깨진다.
      expect(isSelfHostedOllamaUrl(raw)).toBe(false);
    },
  );
});

describe('OllamaService 생성자', () => {
  it('OLLAMA_URL 이 없으면 로컬 기본값으로 기동한다', () => {
    expect(() => new OllamaService(configWith(undefined))).not.toThrow();
  });

  it('자체 운영 범위면 기동한다', () => {
    expect(() => new OllamaService(configWith('http://192.168.1.50:11434'))).not.toThrow();
  });

  // 세션 메모 원문이 외부로 나가면 개인정보처리방침 제6조의 고지가 거짓이 된다.
  // 조용히 동작하는 것보다 기동 실패가 맞다.
  it('외부 엔드포인트를 가리키면 기동을 거부한다', () => {
    expect(() => new OllamaService(configWith('https://ollama.example.com'))).toThrow(
      /자체 운영 범위를 벗어납니다/,
    );
  });

  it('거부 메시지에 문제가 된 값을 담는다', () => {
    expect(() => new OllamaService(configWith('https://api.openai.com'))).toThrow(
      /https:\/\/api\.openai\.com/,
    );
  });
});
