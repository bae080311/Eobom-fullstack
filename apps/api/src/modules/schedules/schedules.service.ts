import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from '@eobom/shared';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(_query: ScheduleQueryDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async findOne(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  async create(_dto: CreateScheduleDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async update(_id: string, _dto: UpdateScheduleDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async cancel(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  async confirm(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }
}
