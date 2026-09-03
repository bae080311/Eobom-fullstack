import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, OrgMemberRole, OrgMembershipStatus } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { ReportService } from './report.service.js';
import type { PrismaService } from '../../database/prisma.service.js';
import type { OllamaService } from './ollama.service.js';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  schedule: { findUnique: vi.fn() },
  therapistProfile: { findUnique: vi.fn() },
  parentProfile: { findUnique: vi.fn() },
  organizationMembership: { findFirst: vi.fn() },
  parentChildLink: { findUnique: vi.fn() },
  sessionReport: { upsert: vi.fn(), findUnique: vi.fn() },
});

const makeOllama = () => ({ generateReport: vi.fn() });

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeSchedule = (overrides?: object) => ({
  id: 's1',
  organizationId: 'org1',
  childId: 'c1',
  therapistId: 'tp1', // 담당 치료사 — generate/findOne 권한은 이 값과 무관하게 org 멤버십만 본다
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

  beforeEach(() => {
    prisma = makePrisma();
    ollama = makeOllama();
    service = new ReportService(
      prisma as unknown as PrismaService,
      ollama as unknown as OllamaService,
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
      prisma.sessionReport.upsert.mockResolvedValue(makeReportRow());

      const result = await service.generate('s1', otherTherapistUser, { memo: '메모' });

      expect(ollama.generateReport).toHaveBeenCalledWith('메모');
      expect(result.data.id).toBe('r1');
    });

    it('정상 흐름에서 promptVersion을 태깅해 scheduleId 기준 upsert한다', async () => {
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
      prisma.sessionReport.upsert.mockResolvedValue(makeReportRow());

      await service.generate('s1', therapistUser, { memo: '오늘 세션 메모' });

      expect(prisma.sessionReport.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scheduleId: 's1' },
          create: expect.objectContaining({ scheduleId: 's1', promptVersion: 'report-v1' }),
          update: expect.objectContaining({ promptVersion: 'report-v1' }),
        }),
      );
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
        expect(prisma.sessionReport.findUnique).not.toHaveBeenCalled();
      });

      it('연결된 아동이면 리포트를 조회한다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });
        prisma.sessionReport.findUnique.mockResolvedValue(makeReportRow());

        const result = await service.findOne('s1', parentUser);

        expect(result.data?.id).toBe('r1');
      });

      it('리포트가 아직 없으면 data: null을 반환한다', async () => {
        prisma.schedule.findUnique.mockResolvedValue(makeSchedule());
        prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
        prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });
        prisma.sessionReport.findUnique.mockResolvedValue(null);

        const result = await service.findOne('s1', parentUser);

        expect(result).toEqual({ data: null });
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

        expect(result.data?.id).toBe('r1');
      });
    });
  });
});
