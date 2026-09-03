import { test, expect } from "@playwright/test";
import { OrgMemberRole, OrgMembershipStatus } from "@eobom/shared";
import { db, resetDb, readJoinCode } from "./support/db";
import { signUpTherapist, passEmailVerification } from "./support/actions";

/**
 * 🅰️ 기관 셋업 흐름 — 레이어 1 §1.4와 1대일 대응 (레이어 5 §5.12 요구사항).
 *
 *  1. 치료사 A가 회원가입한다.
 *  2. A가 신규 기관 생성 / 기존 기관 참여 코드 가입 중 선택한다.
 *  3. 신규 생성 시 A는 자동으로 OWNER가 되고, 참여 코드가 자동 발급된다.
 *  4. 이후 가입하는 치료사 B는 참여 코드를 입력해 같은 기관에 THERAPIST로 합류한다.
 */

const ORG_NAME = "맑은소리 언어치료센터";

const THERAPIST_A = {
  email: "therapist-a@e2e.test",
  name: "김치료",
  password: "E2ePassword!1",
};

const THERAPIST_B = {
  email: "therapist-b@e2e.test",
  name: "박치료",
  password: "E2ePassword!1",
};

test.beforeEach(async () => {
  await resetDb();
});

test.afterAll(async () => {
  await db.$disconnect();
});

test("치료사 A가 기관을 만들고 OWNER가 되며, 치료사 B가 참여 코드로 합류한다", async ({
  browser,
}) => {
  // --- 1~3단계: 치료사 A 가입 + 신규 기관 생성 ---
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  await signUpTherapist(pageA, THERAPIST_A, {
    mode: "CREATE",
    value: ORG_NAME,
  });

  // 기관 관리 화면에 기관명과 자동 발급된 참여 코드가 노출된다.
  const joinCode = await readJoinCode(ORG_NAME);
  expect(joinCode).toMatch(/^[0-9A-F]{8}$/);

  // 기관명은 헤더와 본문에 함께 노출돼 여러 번 매칭된다.
  await pageA.goto("/organization");
  await expect(pageA.getByText(ORG_NAME).first()).toBeVisible();
  await expect(pageA.getByText(joinCode)).toBeVisible();

  // A는 해당 기관의 OWNER여야 한다.
  const ownerMembership = await db.organizationMembership.findFirst({
    where: { therapistProfile: { user: { email: THERAPIST_A.email } } },
    include: { organization: true },
  });
  expect(ownerMembership?.role).toBe(OrgMemberRole.OWNER);
  expect(ownerMembership?.status).toBe(OrgMembershipStatus.ACTIVE);
  expect(ownerMembership?.organization.name).toBe(ORG_NAME);

  // --- 4단계: 치료사 B가 참여 코드로 같은 기관에 합류 ---
  // 별도 컨텍스트를 써서 A의 로그인 쿠키를 물려받지 않게 한다.
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  await signUpTherapist(pageB, THERAPIST_B, { mode: "JOIN", value: joinCode });

  const memberMembership = await db.organizationMembership.findFirst({
    where: { therapistProfile: { user: { email: THERAPIST_B.email } } },
  });
  expect(memberMembership?.role).toBe(OrgMemberRole.THERAPIST);
  expect(memberMembership?.status).toBe(OrgMembershipStatus.ACTIVE);
  // 같은 기관에 들어갔는지 — 이 흐름의 핵심 단정.
  expect(memberMembership?.organizationId).toBe(
    ownerMembership?.organizationId,
  );

  // A의 기관 관리 화면에서 멤버 2명이 보인다.
  await pageA.goto("/organization");
  await expect(pageA.getByText(THERAPIST_A.name).first()).toBeVisible();
  await expect(pageA.getByText(THERAPIST_B.name).first()).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test("존재하지 않는 참여 코드로는 기관에 합류할 수 없다", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "언어치료사" }).click();

  await passEmailVerification(page, THERAPIST_B.email);

  await page.getByPlaceholder("홍길동").fill(THERAPIST_B.name);
  await page.getByPlaceholder("8자 이상").fill(THERAPIST_B.password);
  await page
    .getByPlaceholder("비밀번호를 다시 입력하세요")
    .fill(THERAPIST_B.password);
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByRole("button", { name: "코드로 참여" }).click();
  await page.getByPlaceholder("ABCD1234").fill("DEADBEEF");
  await page.getByRole("button", { name: "가입 완료" }).click();

  // 가입 단계에 머무르며 에러가 노출되고, 계정은 만들어지지 않는다.
  await expect(page.getByText("유효하지 않은 참여 코드입니다.")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);

  const created = await db.user.findUnique({
    where: { email: THERAPIST_B.email },
  });
  expect(created).toBeNull();
});
