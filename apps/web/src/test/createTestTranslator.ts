type Values = Record<string, string | number>;

function resolveKey(namespaceMessages: object, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    throw new Error(`Missing test message key: ${key}`);
  }, namespaceMessages);
}

// next-intl 훅 없이 messages/ko.json을 직접 조회하는 최소 번역기 — 순수 함수·컴포넌트 단위 테스트용.
// next-intl의 실제 translator와 동일하게 호출 가능한 함수에 raw()를 덧붙인 형태로 반환한다.
export function createTestTranslator(namespaceMessages: object) {
  function t(key: string, values?: Values): string {
    const raw = resolveKey(namespaceMessages, key);
    if (typeof raw !== 'string') {
      throw new Error(`Test message key "${key}" does not resolve to a string`);
    }
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
      // next-intl은 ICU 플레이스홀더에 대응하는 값이 없으면 렌더링 에러를 던진다 —
      // 테스트 더블도 동일하게 실패해야 인자 이름 오타(예: {minuets})를 놓치지 않는다.
      if (!values || !(name in values)) {
        throw new Error(`Missing interpolation value "${name}" for key "${key}"`);
      }
      return String(values[name]);
    });
  }
  t.raw = (key: string): unknown => resolveKey(namespaceMessages, key);
  return t;
}
