import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole, OrgMemberRole, OrgMembershipStatus, NotificationType } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { ReportService } from './report.service.js';
import type { PrismaService } from '../../database/prisma.service.js';
import type { OllamaService } from './ollama.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const makePrisma = () => {
  const models = {
    schedule: { findUnique: vi.fn() },
    therapistProfile: { findUnique: vi.fn() },
    parentProfile: { findUnique: vi.fn() },
    organizationMembership: { findFirst: vi.fn() },
    parentChildLink: { findUnique: vi.fn() },
    sessionReport: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  };

  // 리포트 최초 생성과 알림은 한 트랜잭션이다. tx는 전역 클라이언트와 다른 객체로 둬서
  // 서비스가 알림에 tx를 넘기는지 확인할 수 있게 한다(모델 mock은 같은 참조를 공유).
  const txClient = { ...models };
  const prisma = { ...models, txClient, $transaction: vi.fn() };
  prisma.$transaction.mockImplementation((cb: (tx: typeof txClient) => unknown) => cb(txClient));
  return prisma;
};

const makeOllama = () => ({ generateReport: vi.fn() });

const makeNotifications = () => ({ notifyScheduleEvent: vi.fn() });

/**
 * scheduleId unique 제약 위반. 다른 요청이 먼저 리포트를 만들었을 때 Prisma가 던지는 것.
 * 서비스가 `instanceof PrismaClientKnownRequestError` + `code === 'P2002'`로 판별하므로
 * 실제 클래스를 써야 한다.
 */
const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeSchedule = (overrides?: object) => ({
  id: 's1',
  organizationId: 'org1',
  childId: 'c1',
  therapistId: 'tp1', // 담당 치료사 — generate/findOne 권한은 이 값과 무관하게 org 멤버십만 본다
  startAt: new Date('2025-06-01T05:00:00Z'), // 알림 payload에 실린다
  ...overrides,
});

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeParentProfile = (overrides?: object) => ({ id: 'pp1', userId: 'pu1', ...overrides });

const makeMembership = (overrides?: object) => ({
  id: 'mem1',
  organizationId: 'org1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  ...overrides,
});

const makeReportRow = (overrides?: object) => ({
  id: 'r1',
  scheduleId: 's1',
  rawMemo: '오늘 ㄹ 발음 연습을 진행함',
  summary: '오늘은 ㄹ 발음 연습을 즐겁게 진행했어요.',
  activities: ['ㄹ 발음 카드놀이'],
  progress: '조음 정확도가 향상되고 있어요.',
  homework: null,
  nextGoal: '연속 발화에서 ㄹ 발음 연습',
  tone: 'positive',
  promptVersion: 'report-v1',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

const therapistUser: IUser = {
  id: 'u1',
  email: 't@x.com',
  name: '이치료',
  role: UserRole.THERAPIST,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const otherTherapistUser: IUser = {
  ...therapistUser,
  id: 'u2',
  name: '박치료',
};

const parentUser: IUser = {
  id: 'pu1',
  email: 'p@x.com',
  name: '김부모',
  role: UserRole.PARENT,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ReportService', () => {
  let service: ReportService;
  let prisma: ReturnType<typeof makePrisma>;
  let ollama: ReturnType<typeof makeOllama>;
  let notifications: ReturnType<typeof makeNotifications>;

  beforeEach(() => {
    prisma = makePrisma();
    ollama = makeOllama();
    notifications = makeNotifications();
    service = new ReportService(
      prisma as unknown as PrismaService,
      ollama as unknown as OllamaService,
      notifications as unknown as NotificationsService,
    );
  });

  // -------------------------------------------------------------------------
  // generate
  // -------------------------------------------------------------------------

  describe('generate', () => {
    it('THERAPIST가 아니면 ForbiddenException을 던진다', async () => {
      await expect(service.generate('s1', parentUser, { memo: '메모' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.schedule.findUnique).not.toHaveBeenCalled();
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.generate('s-none', therapistUser, { memo: '메모' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.generate('s1', therapistUser, { memo: '메모' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('일정 기관에 대한 활성 멤버십이 없으면 ForbiddenException을 던진다 (org-scope)', async () => {
      prisma.schedule.findUnique.mockResolvedValue(makeSchedule({ organizationId: 'org1' }));
      prisma.therapistProfile.findUnique.mockResolvedValue(
        makeProfile({ id: 'tp2', userId: 'u2' }),
      );
      prisma.organizationMembership.findFirst.mockResolvedValue(null); // org2에만 소속돼 org1 매칭 없음

      await expect(service.generate('s1', otherTherapistUser, { memo: '메모' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.organizationMembership.findFirst).toHaveBeenCalledWith({
        where: {
          therapistProfileId: 'tp2',
          organizationId: 'org1',
          status: OrgMembershipStatus.ACTIVE,
        },
      });
      expect(ollama.generateReport).not.toHaveBeenCalled();
    });

    it('담당 치료사가 아니어도 같은 기관 ACTIVE 멤버면 생성할 수 있다', async () => {
      prisma.schedule.findUnique.mockResolvedValue(
        makeSchedule({ organizationId: 'org1', therapistId: 'tp1' }),
      );
      prisma.therapistProfile.findUnique.mockResolvedValue(
        makeProfile({ id: 'tp2', userId: 'u2' }),
      );
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ therapistProfileId: 'tp2', organizationId: 'org1' }),
      );
      ollama.generateReport.mockResolvedValue({
        summary: '요약',
        activities: ['활동1'],
        progress: '진행상황',
        homework: null,
        nextGoal: '다음 목표',
        tone: 'positive',
      });
      prisma.sessionReport.create.mockResolvedValue(makeReportRow());

      const result = await service.generate('s1', otherTherapistUser, { memo: '메모' });

      expect(ollama.generateReport).toHaveBeenCalledWith('메모');
      expect(result.id).toBe('r1');
    });

    it('정상 흐름에서 promptVersion을 태깅해 scheduleId로 생성한다', async () => {
      prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      ollama.generateReport.mockResolvedValue({
        summary: '요약',
        activities: ['활동1'],
        progress: '진행상황',
        homework: '집에서 연습하기',
        nextGoal: '다음 목표',
        tone: 'positive',
      });
      prisma.sessionReport.create.mockResolvedValue(makeReportRow());

      await service.generate('s1', therapistUser, { memo: '오늘 세션 메모' });

      expect(prisma.sessionReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ scheduleId: 's1', promptVersion: 'report-v1' }),
      });
    });

    describe('학부모 알림', () => {
      const arrangeHappyPath = () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
        prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
        ollama.generateReport.mockResolvedValue({
          summary: '요약',
          activities: ['활동1'],
          progress: '진행상황',
          homework: null,
          nextGoal: '다음 목표',
          tone: 'positive',
        });
        prisma.sessionReport.create.mockResolvedValue(makeReportRow());
      };

      it('처음 작성하면 연결된 학부모에게 알림을 보낸다', async () => {
        arrangeHappyPath(); // create가 성공 = 선점 성공 = 최초 작성

        await service.generate('s1', therapistUser, { memo: '오늘 세션 메모' });

        // 첫 인자는 리포트 생성과 같은 트랜잭션의 클라이언트다.
        expect(notifications.notifyScheduleEvent).toHaveBeenCalledWith(prisma.txClient, {
          scheduleId: 's1',
          childId: 'c1',
          organizationId: 'org1',
          type: NotificationType.SESSION_REPORT_CREATED,
          payload: { startAt: '2025-06-01T05:00:00.000Z' },
        });
      });

      // 여기서 알림을 놓치면 복구 경로가 없다 — 이후 generate는 전부 update 경로라
      // 알림을 보내지 않으므로, 리포트만 커밋되면 학부모는 영구히 모른다.
      it('알림 생성이 실패하면 리포트 최초 생성도 실패한다', async () => {
        arrangeHappyPath();
        notifications.notifyScheduleEvent.mockRejectedValue(new Error('알림 실패'));

        await expect(
          service.generate('s1', therapistUser, { memo: '오늘 세션 메모' }),
        ).rejects.toThrow('알림 실패');
        // unique 위반이 아니므로 update 경로로 빠지지 않는다.
        expect(prisma.sessionReport.update).not.toHaveBeenCalled();
      });

      // 재생성은 덮어쓰기다. 문구를 다듬을 때마다 알림이 쌓이면 소음이 된다.
      it('재생성할 때는 알림을 보내지 않는다', async () => {
        arrangeHappyPath();
        prisma.sessionReport.create.mockRejectedValue(uniqueViolation());
        prisma.sessionReport.update.mockResolvedValue(makeReportRow());

        await service.generate('s1', therapistUser, { memo: '다시 쓴 메모' });

        expect(prisma.sessionReport.update).toHaveBeenCalledWith({
          where: { scheduleId: 's1' },
          data: expect.objectContaining({ rawMemo: '다시 쓴 메모' }),
        });
        expect(notifications.notifyScheduleEvent).not.toHaveBeenCalled();
      });

      // 동시 요청 둘이 사전 조회로 "없음"을 함께 읽으면 각자 알림을 보낸다.
      // unique 제약으로 선점하므로 뒤늦은 요청은 update 경로로 빠지고 알림이 없다.
      it('동시 생성에서 선점에 실패한 요청은 알림을 보내지 않는다', async () => {
        arrangeHappyPath();
        prisma.sessionReport.create.mockRejectedValue(uniqueViolation());
        prisma.sessionReport.update.mockResolvedValue(makeReportRow());

        await service.generate('s1', therapistUser, { memo: '메모' });

        expect(notifications.notifyScheduleEvent).not.toHaveBeenCalled();
      });

      // unique 위반이 아닌 오류는 삼키지 않는다.
      it('unique 위반이 아닌 DB 오류는 그대로 전파한다', async () => {
        arrangeHappyPath();
        prisma.sessionReport.create.mockRejectedValue(new Error('connection lost'));

        await expect(service.generate('s1', therapistUser, { memo: '메모' })).rejects.toThrow(
          'connection lost',
        );
        expect(prisma.sessionReport.update).not.toHaveBeenCalled();
        expect(notifications.notifyScheduleEvent).not.toHaveBeenCalled();
      });

      it('권한이 없으면 알림도 보내지 않는다', async () => {
        await expect(service.generate('s1', parentUser, { memo: '메모' })).rejects.toThrow(
          ForbiddenException,
        );
        expect(notifications.notifyScheduleEvent).not.toHaveBeenCalled();
      });
    });

    it('생성 응답에는 rawMemo가 포함된다 (치료사 전용 경로)', async () => {
      prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      ollama.generateReport.mockResolvedValue({
        summary: '요약',
        activities: ['활동1'],
        progress: '진행상황',
        homework: null,
        nextGoal: '다음 목표',
        tone: 'positive',
      });
      prisma.sessionReport.create.mockResolvedValue(makeReportRow());

      const result = await service.generate('s1', therapistUser, { memo: '오늘 세션 메모' });

      expect(result.rawMemo).toBe('오늘 ㄹ 발음 연습을 진행함');
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('일정이 없으면 NotFoundException을 던진다', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('s-none', parentUser)).rejects.toThrow(NotFoundException);
    });

    describe('PARENT', () => {
      it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(null);

        await expect(service.findOne('s1', parentUser)).rejects.toThrow(NotFoundException);
      });

      it('연결된 아동이 아니면 ForbiddenException을 던진다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue(null);

        await expect(service.findOne('s1', parentUser)).rejects.toThrow(ForbiddenException);
        expect(prisma.parentChildLink.findUnique).toHaveBeenCalledWith({
          where: { parentId_childId: { parentId: 'pp1', childId: 'c1' } },
        });
        expect(prisma.sessionReport.findUnique).not.toHaveBeenCalled();
      });

      it('연결된 아동이면 리포트를 조회한다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });
        prisma.sessionReport.findUnique.mockResolvedValue(makeReportRow());

        const result = await service.findOne('s1', parentUser);

        expect(prisma.parentChildLink.findUnique).toHaveBeenCalledWith({
          where: { parentId_childId: { parentId: 'pp1', childId: 'c1' } },
        });
        expect(result?.id).toBe('r1');
      });

      it('학부모 응답에는 rawMemo(치료사 원본 메모)가 아예 없다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });
        prisma.sessionReport.findUnique.mockResolvedValue(
          makeReportRow({ rawMemo: '종성 탈락 잔존, 보호자 상담 필요' }),
        );

        const result = await service.findOne('s1', parentUser);

        // undefined 단정만으로는 키가 남아 있는 경우를 못 잡는다 — 직렬화되면 값이 노출된다.
        expect(result).not.toHaveProperty('rawMemo');
        expect(JSON.stringify(result)).not.toContain('종성 탈락');
        // 요약본 필드는 그대로 내려간다
        expect(result?.summary).toBe('오늘은 ㄹ 발음 연습을 즐겁게 진행했어요.');
      });

      // 엔벨로프는 전역 인터셉터가 씌운다 — 서비스는 null을 그대로 돌려준다.
      // HTTP 응답은 { data: null }이 된다 (레이어 5 §5.10).
      it('리포트가 아직 없으면 null을 반환한다 (404가 아니다)', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });
        prisma.sessionReport.findUnique.mockResolvedValue(null);

        const result = await service.findOne('s1', parentUser);

        expect(result).toBeNull();
      });
    });

    describe('THERAPIST', () => {
      it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.therapistProfile.findUnique.mockResolvedValue(null);

        await expect(service.findOne('s1', therapistUser)).rejects.toThrow(NotFoundException);
      });

      it('일정 기관에 대한 활성 멤버십이 없으면 ForbiddenException을 던진다 (org-scope)', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule({ organizationId: 'org1' }));
        prisma.therapistProfile.findUnique.mockResolvedValue(
          makeProfile({ id: 'tp2', userId: 'u2' }),
        );
        prisma.organizationMembership.findFirst.mockResolvedValue(null);

        await expect(service.findOne('s1', otherTherapistUser)).rejects.toThrow(ForbiddenException);
        expect(prisma.organizationMembership.findFirst).toHaveBeenCalledWith({
          where: {
            therapistProfileId: 'tp2',
            organizationId: 'org1',
            status: OrgMembershipStatus.ACTIVE,
          },
        });
      });

      it('담당 치료사가 아니어도 같은 기관 ACTIVE 멤버면 조회할 수 있다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(
          makeSchedule({ organizationId: 'org1', therapistId: 'tp1' }),
        );
        prisma.therapistProfile.findUnique.mockResolvedValue(
          makeProfile({ id: 'tp2', userId: 'u2' }),
        );
        prisma.organizationMembership.findFirst.mockResolvedValue(
          makeMembership({ therapistProfileId: 'tp2', organizationId: 'org1' }),
        );
        prisma.sessionReport.findUnique.mockResolvedValue(makeReportRow());

        const result = await service.findOne('s1', otherTherapistUser);

        expect(result?.id).toBe('r1');
      });

      it('치료사 응답에는 rawMemo가 포함된다 (재생성 폼 프리필용)', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
        prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
        prisma.sessionReport.findUnique.mockResolvedValue(makeReportRow());

        const result = await service.findOne('s1', therapistUser);

        expect(result?.rawMemo).toBe('오늘 ㄹ 발음 연습을 진행함');
      });
    });
  });
});
