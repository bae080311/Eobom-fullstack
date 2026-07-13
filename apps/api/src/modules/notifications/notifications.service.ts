import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto, NotificationPayload } from '@eobom/shared';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<NotificationResponseDto[]> {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

    const notifications = await this.prisma.notification.findMany({
      where: { parentId: profile.id },
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
    message: string;
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
          payload: { message: params.message },
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
      payload: n.payload as NotificationPayload,
      isRead: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
