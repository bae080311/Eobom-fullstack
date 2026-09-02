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
    if (!values) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));
  }
  t.raw = (key: string): unknown => resolveKey(namespaceMessages, key);
  return t;
}
