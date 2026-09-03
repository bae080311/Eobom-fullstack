import { PrismaClient } from '@prisma/client';

/**
 * e2e 전용 Prisma 클라이언트.
 *
 * 브라우저로 검증할 수 없는 두 가지를 담당한다.
 *  1) 시나리오 간 DB 초기화
 *  2) 이메일·오프라인으로 전달되는 값 읽기
 *     — 인증 코드(메일), 기관 참여 코드(구두 전달), 학부모 초대 코드
 *     레이어 1 §1.4 시퀀스 다이어그램의 `(오프라인) 전달` 구간에 해당한다.
 */

const url =
  process.env.E2E_DATABASE_URL ?? 'postgresql://eobom:eobom_password@localhost:5434/eobom_test';

export const db = new PrismaClient({ datasources: { db: { url } } });

/** public 스키마의 모든 테이블을 비운다(마이그레이션 이력 제외). 스키마가 바뀌어도 따라간다. */
export async function resetDb(): Promise<void> {
  const tables = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const targets = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${targets} CASCADE`);
}

/** 조건이 만족될 때까지 짧게 폴링한다. API 처리가 브라우저 액션보다 늦게 끝나는 구간에 쓴다. */
async function waitFor<T>(label: string, read: () => Promise<T | null>, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = await read();
    if (found) return found;
    if (Date.now() >= deadline)
      throw new Error(`${label}: ${timeoutMs}ms 내에 생성되지 않았습니다`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/**
 * 이메일로 발송된 6자리 인증 코드를 DB에서 읽는다.
 * `verifyCode`가 성공하면 이 레코드는 삭제되므로 OTP 입력 전에 읽어야 한다.
 */
export function readVerificationCode(email: string): Promise<string> {
  return waitFor(`인증 코드(${email})`, async () => {
    const req = await db.emailVerificationRequest.findUnique({
      where: { email },
    });
    return req?.code ?? null;
  });
}

/** 기관 참여 코드(joinCode)를 읽는다. 흐름상 치료사 A가 B에게 오프라인으로 전달하는 값. */
export function readJoinCode(organizationName: string): Promise<string> {
  return waitFor(`기관 참여 코드(${organizationName})`, async () => {
    const org = await db.organization.findFirst({
      where: { name: organizationName },
    });
    return org?.joinCode ?? null;
  });
}

/** 학부모 초대 코드(PARENT_LINK)를 읽는다. 치료사가 학부모에게 오프라인으로 전달하는 값. */
export function readParentInviteCode(childName: string): Promise<string> {
  return waitFor(`학부모 초대 코드(${childName})`, async () => {
    const invite = await db.inviteCode.findFirst({
      where: { child: { name: childName } },
      orderBy: { createdAt: 'desc' },
    });
    return invite?.code ?? null;
  });
}
