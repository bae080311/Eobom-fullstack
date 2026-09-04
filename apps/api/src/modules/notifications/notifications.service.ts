import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto, NotificationPayload } from '@eobom/shared';

// 알림 카드에 "누구의·어디 일정"을 표시하기 위한 조인. 저장된 payload 대신
// 조회 시점에 채우므로 이름이 바뀌어도, 과거 알림이어도 최신 값이 나온다.
const DISPLAY_CONTEXT_INCLUDE = {
  organization: { select: { name: true } },
  child: { select: { name: true } },
  schedule: { select: { therapist: { select: { user: { select: { name: true } } } } } },
} as const;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<NotificationResponseDto[]> {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

    const notifications = await this.prisma.notification.findMany({
      where: { parentId: profile.id },
      include: DISPLAY_CONTEXT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    this.logger.log(`findAll: parentId=${profile.id} count=${notifications.length}`);
    return notifications.map(this.toDto);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('알림을 찾을 수 없습니다.');
    if (notification.parentId !== profile.id) throw new ForbiddenException();

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      include: DISPLAY_CONTEXT_INCLUDE,
    });

    return this.toDto(updated);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

    await this.prisma.notification.updateMany({
      where: { parentId: profile.id, readAt: null },
      data: { readAt: new Date() },
    });

    this.logger.log(`markAllAsRead: parentId=${profile.id}`);
  }

  async notifyScheduleEvent(params: {
    scheduleId: string;
    childId: string;
    organizationId: string;
    type: NotificationType;
    /** 완성된 문장이 아니라 문구 조립에 필요한 값만 담는다 — 번역은 웹이 한다. */
    payload: NotificationPayload;
  }): Promise<void> {
    try {
      const links = await this.prisma.parentChildLink.findMany({
        where: { childId: params.childId },
        select: { parentId: true },
      });

      if (links.length === 0) {
        this.logger.log(
          `notifyScheduleEvent: no parents linked to child=${params.childId}, skipping (type=${params.type} scheduleId=${params.scheduleId})`,
        );
        return;
      }

      await this.prisma.notification.createMany({
        data: links.map((l) => ({
          parentId: l.parentId,
          type: params.type,
          scheduleId: params.scheduleId,
          childId: params.childId,
          organizationId: params.organizationId,
          payload: { ...params.payload },
        })),
      });

      this.logger.log(
        `notifyScheduleEvent: type=${params.type} scheduleId=${params.scheduleId} count=${links.length}`,
      );
    } catch (error) {
      this.logger.error(
        `notifyScheduleEvent failed: type=${params.type} scheduleId=${params.scheduleId}`,
        error,
      );
    }
  }

  private toDto(n: {
    id: string;
    parentId: string;
    type: string;
    scheduleId: string | null;
    childId: string | null;
    organization: { name: string } | null;
    child: { name: string } | null;
    schedule: { therapist: { user: { name: string } } } | null;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponseDto {
    return {
      id: n.id,
      parentId: n.parentId,
      type: n.type as NotificationType,
      scheduleId: n.scheduleId,
      childId: n.childId,
      organizationName: n.organization?.name ?? null,
      therapistName: n.schedule?.therapist.user.name ?? null,
      childName: n.child?.name ?? null,
      payload: n.payload as NotificationPayload,
      isRead: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
