import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type * as NextIntl from 'next-intl';
import type * as NextIntlServer from 'next-intl/server';
import ko from '../../messages/ko.json';
import { createTestTranslator } from './createTestTranslator';

function resolveNamespace(namespace?: string): object {
  if (!namespace) return ko;
  return namespace.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    throw new Error(`Missing test message namespace: ${namespace}`);
  }, ko) as object;
}

// 컴포넌트가 useTranslations/getTranslations를 호출해도 NextIntlClientProvider 없이
// 렌더링·단위 테스트가 가능하도록, 실제 messages/ko.json을 조회하는 번역기로 대체한다.
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof NextIntl>();
  return {
    ...actual,
    useTranslations: (namespace?: string) => createTestTranslator(resolveNamespace(namespace)),
  };
});

vi.mock('next-intl/server', async (importOriginal) => {
  const actual = await importOriginal<typeof NextIntlServer>();
  return {
    ...actual,
    getTranslations: async (namespace?: string) =>
      createTestTranslator(resolveNamespace(namespace)),
    getLocale: async () => 'ko',
    getMessages: async () => ko,
  };
});
