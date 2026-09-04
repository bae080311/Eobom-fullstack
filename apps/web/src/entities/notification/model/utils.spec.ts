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

describe('mapDtoToNotification — 본문 조립', () => {
  // API는 완성된 문장을 저장하지 않는다. payload의 원자 데이터로 웹이 문구를 만든다.
  it('시작 시각만 있으면 날짜·시간을 보여준다', () => {
    const n = mapDtoToNotification(
      makeDto({ payload: { startAt: '2026-06-01T05:00:00.000Z' } }),
      t,
    );
    expect(n.sub).toBe('6월 1일 (월) 14:00');
  });

  it('시간이 바뀐 알림은 이전 → 이후로 보여준다', () => {
    const n = mapDtoToNotification(
      makeDto({
        payload: { prevStartAt: '2026-06-01T05:00:00.000Z', startAt: '2026-06-02T06:00:00.000Z' },
      }),
      t,
    );
    expect(n.sub).toBe('6월 1일 (월) 14:00 → 6월 2일 (화) 15:00');
  });

  it('반복 일정 일괄 생성은 "외 N건"을 덧붙인다', () => {
    const n = mapDtoToNotification(
      makeDto({ payload: { startAt: '2026-06-01T05:00:00.000Z', scheduleCount: 5 } }),
      t,
    );
    expect(n.sub).toBe('6월 1일 (월) 14:00 외 4건');
  });

  it('건수가 1이면 반복 문구를 붙이지 않는다', () => {
    const n = mapDtoToNotification(
      makeDto({ payload: { startAt: '2026-06-01T05:00:00.000Z', scheduleCount: 1 } }),
      t,
    );
    expect(n.sub).toBe('6월 1일 (월) 14:00');
  });

  it('구조화 이전에 저장된 알림은 payload.message를 그대로 쓴다', () => {
    // startAt이 없는 과거 알림. 마이그레이션 없이 계속 읽을 수 있어야 한다.
    const n = mapDtoToNotification(makeDto({ payload: { message: '예전 문구' } }), t);
    expect(n.sub).toBe('예전 문구');
  });

  it('payload가 비어 있으면 빈 문자열이다', () => {
    expect(mapDtoToNotification(makeDto({ payload: {} }), t).sub).toBe('');
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
