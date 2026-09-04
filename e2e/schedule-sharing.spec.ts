import { test, expect, type Page } from '@playwright/test';
import { NotificationType, ScheduleStatus } from '@eobom/shared';
import { db, resetDb, readJoinCode, readParentInviteCode } from './support/db';
import { signUpTherapist, signUpParent } from './support/actions';

/**
 * 🅱️ 일정 공유 흐름 — 레이어 1 §1.4와 1대일 대응 (레이어 5 §5.12 요구사항).
 *
 *  1. 치료사가 본인 기관 안에 아동을 등록한다(본인이 자동으로 primaryTherapist).
 *  2. 치료사가 학부모 초대 코드를 생성한다.
 *  3. 학부모가 회원가입한다.
 *  4. 학부모가 초대 코드를 입력해 아동과 연결된다.
 *  5. 치료사가 치료 일정을 등록한다.
 *  6. 학부모가 연결된 아동의 일정을 조회한다(기관명·치료사명 함께 표기).
 *  7. 학부모가 일정을 확인 처리한다.
 *  8. 일정 생성 시 학부모에게 알림이 생성된다.
 */

const ORG_NAME = '맑은소리 언어치료센터';
const CHILD_NAME = '홍길동';
// getByText는 부분일치라 기관명('...언어치료센터')에 포함되지 않는 값이어야 한다.
// 특히 '차단' 시나리오의 toHaveCount(0)이 기관명에 걸려 오탐하는 것을 막는다.
const SCHEDULE_TITLE = '조음 훈련';

const THERAPIST = {
  email: 'therapist@e2e.test',
  name: '김치료',
  password: 'E2ePassword!1',
};
const PARENT = {
  email: 'parent@e2e.test',
  name: '이학부모',
  password: 'E2ePassword!1',
};

/**
 * 일정 폼의 날짜 입력에 넣을 값. 오늘 이후로 두어 '예정된 일정'에 노출되게 한다.
 *
 * `toISOString()`은 UTC로 직렬화하므로 로컬 기준 +1일과 어긋날 수 있다
 * (예: KST 오전이면 UTC 날짜는 하루 전이라 '오늘'이 나온다).
 * 폼의 <input type="date">는 로컬 날짜를 받으므로 로컬 구성요소로 조립한다.
 */
function tomorrowLocalDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** 아동 등록 모달을 열어 아동을 만든다. */
async function createChild(page: Page, name: string) {
  await page.goto('/children');
  await page.getByRole('button', { name: '아동 추가' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('예: 홍길동').fill(name);
  await dialog.getByRole('button', { name: '등록' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(name).first()).toBeVisible();
}

/** 발급 코드 화면에서 해당 아동의 학부모 초대코드를 발급한다. */
async function issueParentInviteCode(page: Page) {
  await page.goto('/invite-codes');
  await page.getByRole('button', { name: '초대코드 발급' }).first().click();

  // 발급 결과 다이얼로그에 코드가 노출된다.
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('초대코드가 발급되었어요')).toBeVisible();
  await dialog.getByRole('button', { name: '확인' }).click();
}

/** 단일 일정 하나를 등록한다. */
async function createSchedule(page: Page, childName: string, title: string, date: string) {
  await page.goto('/schedules');
  await page.getByRole('button', { name: '일정 추가' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('select').first().selectOption({ label: childName });
  await dialog.getByPlaceholder('예: 언어치료').fill(title);
  await dialog.locator('input[type="date"]').fill(date);
  await dialog.locator('input[type="time"]').first().fill('14:00');
  await dialog.locator('input[type="time"]').last().fill('14:40');
  await dialog.getByRole('button', { name: '추가' }).click();

  await expect(dialog).toBeHidden();
}

test.beforeEach(async () => {
  await resetDb();
});

test.afterAll(async () => {
  await db.$disconnect();
});

test('치료사가 등록한 일정이 학부모에게 공유되고, 학부모가 확인 처리하면 알림이 남는다', async ({
  browser,
}) => {
  const therapistContext = await browser.newContext();
  const therapistPage = await therapistContext.newPage();

  // --- 사전 조건: 치료사와 기관 ---
  await signUpTherapist(therapistPage, THERAPIST, {
    mode: 'CREATE',
    value: ORG_NAME,
  });
  await readJoinCode(ORG_NAME); // 기관 생성 완료 대기

  // --- 1단계: 아동 등록 (본인이 자동으로 primaryTherapist) ---
  await createChild(therapistPage, CHILD_NAME);

  const child = await db.child.findFirst({
    where: { name: CHILD_NAME },
    include: {
      primaryTherapist: { include: { user: true } },
      organization: true,
    },
  });
  expect(child?.primaryTherapist?.user.email).toBe(THERAPIST.email);
  expect(child?.organization.name).toBe(ORG_NAME);

  // --- 2단계: 학부모 초대 코드 발급 ---
  await issueParentInviteCode(therapistPage);
  const inviteCode = await readParentInviteCode(CHILD_NAME);
  expect(inviteCode).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);

  // --- 3단계: 학부모 회원가입 ---
  const parentContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  await signUpParent(parentPage, PARENT);

  // --- 4단계: 초대 코드 입력 → 아동 연결 (기관명이 함께 노출된다) ---
  await parentPage.goto('/redeem');
  await parentPage.getByPlaceholder('예: A1B2-C3D4').fill(inviteCode);
  await parentPage.locator('select').selectOption('MOTHER');
  await parentPage.getByRole('button', { name: '연결하기' }).click();

  await expect(parentPage.getByText(`${CHILD_NAME} 아동과 연결되었어요`)).toBeVisible();
  await expect(parentPage.getByText(THERAPIST.name).first()).toBeVisible();

  const link = await db.parentChildLink.findFirst({
    where: { parent: { user: { email: PARENT.email } }, childId: child!.id },
  });
  expect(link?.relation).toBe('MOTHER');

  // --- 5단계: 치료사가 일정 등록 ---
  const scheduleDate = tomorrowLocalDate();
  await createSchedule(therapistPage, CHILD_NAME, SCHEDULE_TITLE, scheduleDate);

  const schedule = await db.schedule.findFirst({
    where: { childId: child!.id },
  });
  expect(schedule).not.toBeNull();
  expect(schedule?.title).toBe(SCHEDULE_TITLE);
  expect(schedule?.status).toBe(ScheduleStatus.SCHEDULED);

  // --- 8단계: 일정 생성으로 학부모 알림이 생성된다 ---
  await expect(async () => {
    const notification = await db.notification.findFirst({
      where: { scheduleId: schedule!.id },
    });
    expect(notification?.type).toBe(NotificationType.SCHEDULE_CREATED);
  }).toPass({ timeout: 10_000 });

  // --- 6단계: 학부모가 일정을 조회한다 ---
  await parentPage.goto('/schedule');
  await expect(parentPage.getByText(SCHEDULE_TITLE).first()).toBeVisible();

  // 목록에서 상세로 진입 — 아동명과 담당 치료사명이 표기된다.
  //
  // NOTE: 레이어 1 §1.4 6단계는 "기관명·치료사명 함께 표기"를 요구하지만,
  // 현재 `widgets/schedule-detail`은 기관명을 렌더하지 않는다(치료사명·치료시간·종류·메모만).
  // 학부모 화면 어디에도 organizationName이 노출되지 않아 여기서는 단정하지 않는다.
  // 명세-구현 간극이므로 별도 후속 작업으로 다뤄야 한다.
  await parentPage.getByText(SCHEDULE_TITLE).first().click();
  await expect(parentPage).toHaveURL(new RegExp(`/schedule/${schedule!.id}$`));
  await expect(parentPage.getByText(CHILD_NAME).first()).toBeVisible();
  await expect(parentPage.getByText(THERAPIST.name).first()).toBeVisible();

  // --- 7단계: 학부모가 일정을 확인 처리한다 ---
  await parentPage.getByRole('button', { name: '일정 확인' }).click();
  await expect(parentPage.getByText('일정을 확인하시겠어요?')).toBeVisible();
  await parentPage.getByRole('dialog').getByRole('button', { name: '확인' }).click();

  await expect(parentPage.getByText('확인 완료')).toBeVisible();

  const ack = await db.scheduleAcknowledgement.findFirst({
    where: { scheduleId: schedule!.id },
  });
  expect(ack).not.toBeNull();

  // 알림 화면에서도 일정 생성 알림을 볼 수 있다(카드 제목은 알림 유형 문구로 렌더된다).
  // 어느 아이·어느 센터 알림인지도 함께 보여야 한다 — 레이어 5 §5.9.
  await parentPage.goto('/notifications');
  await expect(parentPage.getByText('새 일정이 등록되었어요').first()).toBeVisible();
  await expect(parentPage.getByText(`${CHILD_NAME} · ${ORG_NAME}`)).toBeVisible();

  await therapistContext.close();
  await parentContext.close();
});

test('연결되지 않은 학부모는 다른 아동의 일정을 조회할 수 없다', async ({ browser }) => {
  const therapistContext = await browser.newContext();
  const therapistPage = await therapistContext.newPage();

  await signUpTherapist(therapistPage, THERAPIST, {
    mode: 'CREATE',
    value: ORG_NAME,
  });
  await createChild(therapistPage, CHILD_NAME);
  await createSchedule(therapistPage, CHILD_NAME, SCHEDULE_TITLE, tomorrowLocalDate());

  const schedule = await db.schedule.findFirst({
    where: { child: { name: CHILD_NAME } },
  });
  expect(schedule).not.toBeNull();

  // 아동과 연결되지 않은 학부모로 가입해 일정 상세에 직접 접근한다.
  const parentContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  await signUpParent(parentPage, PARENT);

  await parentPage.goto('/schedule');
  await expect(parentPage.getByText('예정된 일정이 없습니다')).toBeVisible();

  // 딥링크로도 내용이 노출되지 않는다.
  await parentPage.goto(`/schedule/${schedule!.id}`);
  await expect(parentPage.getByText(SCHEDULE_TITLE)).toHaveCount(0);

  await therapistContext.close();
  await parentContext.close();
});
