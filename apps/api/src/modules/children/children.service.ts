import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateChildDto, UpdateChildDto } from '@eobom/shared';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    throw new Error('Not implemented - Phase 3');
  }

  async findOne(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  async create(_dto: CreateChildDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async update(_id: string, _dto: UpdateChildDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async remove(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }
}
