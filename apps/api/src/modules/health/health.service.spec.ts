import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HealthService } from './health.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

const makePrisma = () => ({ $queryRaw: vi.fn() });

describe('HealthService', () => {
  let service: HealthService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new HealthService(prisma as unknown as PrismaService);
  });

  it('DB 질의가 성공하면 ok를 반환한다', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  // 프로세스만 살아 있고 DB가 끊긴 인스턴스는 트래픽을 받으면 안 된다.
  it('DB 질의가 실패하면 던지지 않고 degraded로 내려준다', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('down');
  });

  it('uptime을 초 단위 정수로 담는다', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    vi.spyOn(process, 'uptime').mockReturnValue(12.7);

    const result = await service.check();

    expect(result.uptimeSeconds).toBe(12);
  });
});
