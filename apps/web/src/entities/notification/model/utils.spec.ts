import { describe, it, expect, vi, afterEach } from 'vitest';
import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto } from '@eobom/shared';
import { mapDtoToNotification, NOTIFICATION_TYPE_TITLES_KO } from './utils';
import { createTestTranslator } from '@/test/createTestTranslator';
import ko from '../../../../messages/ko.json';

const t = createTestTranslator(ko.entities.notification);

function makeDto(overrides: Partial<NotificationResponseDto> = {}): NotificationResponseDto {
  return {
    id: 'n1',
    parentId: 'p1',
    type: NotificationType.SCHEDULE_CREATED,
    scheduleId: 's1',
    childId: 'c1',
    organizationName: '맑은소리 언어치료센터',
    therapistName: '김치료',
    childName: '홍길동',
    payload: { message: '오늘 14:00 · 개별 언어치료' },
    isRead: false,
    createdAt: '2026-06-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('NOTIFICATION_TYPE_TITLES_KO', () => {
  it('SCHEDULE_CREATED 타이틀은 "새 일정이 등록되었어요"이다', () => {
    expect(NOTIFICATION_TYPE_TITLES_KO[NotificationType.SCHEDULE_CREATED]).toBe(
      '새 일정이 등록되었어요',
    );
  });

  it('SCHEDULE_UPDATED 타이틀은 "일정이 변경되었어요"이다', () => {
    expect(NOTIFICATION_TYPE_TITLES_KO[NotificationType.SCHEDULE_UPDATED]).toBe(
      '일정이 변경되었어요',
    );
  });

  it('SCHEDULE_CANCELED 타이틀은 "일정이 취소되었어요"이다', () => {
    expect(NOTIFICATION_TYPE_TITLES_KO[NotificationType.SCHEDULE_CANCELED]).toBe(
      '일정이 취소되었어요',
    );
  });
});

describe('mapDtoToNotification > time (formatRelativeTime)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1분 미만이면 "방금 전"이다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19T00:00:30.000Z'));
    const n = mapDtoToNotification(makeDto({ createdAt: '2026-06-19T00:00:00.000Z' }), t);
    expect(n.time).toBe('방금 전');
  });

  it('정확히 하루 지났으면 daysAgo 템플릿이 아니라 전용 oneDayAgo 키("어제")를 쓴다', () => {
    // group.yesterday와 우연히 같은 문자열이지만 서로 다른 메시지 키를 쓴다 — 회귀 방지용.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));
    const n = mapDtoToNotification(makeDto({ createdAt: '2026-06-19T12:00:00.000Z' }), t);
    expect(n.time).toBe('어제');
  });

  it('이틀 이상 지났으면 "{count}일 전" 형식이다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T00:00:00.000Z'));
    const n = mapDtoToNotification(makeDto({ createdAt: '2026-06-19T00:00:00.000Z' }), t);
    expect(n.time).toBe('3일 전');
  });
});

describe('mapDtoToNotification — 맥락 문구', () => {
  it('아동명과 기관명을 이어 붙인다', () => {
    // 아이가 둘 이상인 학부모는 이 줄이 없으면 어느 아이 알림인지 알 수 없다.
    expect(mapDtoToNotification(makeDto(), t).context).toBe('홍길동 · 맑은소리 언어치료센터');
  });

  it('기관 정보가 없으면 아동명만 남긴다', () => {
    const n = mapDtoToNotification(makeDto({ organizationName: null }), t);
    expect(n.context).toBe('홍길동');
  });

  it('연결 정보가 모두 없으면 빈 문자열이다', () => {
    const n = mapDtoToNotification(
      makeDto({ organizationName: null, childName: null, therapistName: null }),
      t,
    );
    expect(n.context).toBe('');
  });
});
