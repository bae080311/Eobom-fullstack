import { expect, type Page } from '@playwright/test';
import { readVerificationCode } from './db';

/**
 * 회원가입·로그인처럼 두 시나리오가 공유하는 UI 조작을 모아둔다.
 *
 * 셀렉터 주의: `RegisterForm`/`LoginForm`의 `<label>`은 `htmlFor`로 input과 연결돼 있지 않아
 * `getByLabel`이 동작하지 않는다. 그래서 placeholder와 role(button) 기준으로 잡는다.
 */

export interface OrganizationChoice {
  mode: 'CREATE' | 'JOIN';
  /** mode='CREATE'면 새 기관 이름, 'JOIN'이면 참여 코드 */
  value: string;
}

/** 이메일 입력 → 인증 코드 발송 → DB에서 코드를 읽어 OTP 6칸 입력까지 진행한다. */
export async function passEmailVerification(page: Page, email: string) {
  await page.getByPlaceholder('example@email.com').fill(email);
  await page.getByRole('button', { name: '인증 코드 받기' }).click();

  // 발송 성공 시에만 OTP 화면으로 넘어간다(실패하면 여기서 멈춘다).
  await expect(page.getByText('아래 주소로 인증 코드를 발송했습니다')).toBeVisible();

  // 코드 검증이 성공하면 레코드가 삭제되므로 입력 전에 읽어둔다.
  const code = await readVerificationCode(email);

  // 6칸 입력은 한 글자마다 다음 칸으로 포커스가 이동하고, 6자리가 채워지면 자동 검증된다.
  await page.locator('input[inputmode="numeric"]').first().click();
  await page.keyboard.type(code, { delay: 30 });
}

/** 이름·비밀번호 단계(step 3)를 채운다. 치료사는 '다음', 학부모는 '가입 완료' 버튼이 뜬다. */
async function fillProfileStep(page: Page, name: string, password: string, nextLabel: string) {
  await page.getByPlaceholder('홍길동').fill(name);
  await page.getByPlaceholder('8자 이상').fill(password);
  await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(password);
  await page.getByRole('button', { name: nextLabel }).click();
}

/** 치료사 회원가입 전 과정. 기관 생성(CREATE) 또는 참여 코드로 합류(JOIN)까지 마친다. */
export async function signUpTherapist(
  page: Page,
  user: { email: string; name: string; password: string },
  org: OrganizationChoice,
) {
  await page.goto('/register');
  await page.getByRole('button', { name: '언어치료사' }).click();

  await passEmailVerification(page, user.email);
  await fillProfileStep(page, user.name, user.password, '다음');

  // step 4: 기관 설정
  await expect(page.getByText('기관을 설정해주세요')).toBeVisible();

  if (org.mode === 'CREATE') {
    await page.getByRole('button', { name: '새 기관 만들기' }).click();
    await page.getByPlaceholder('예: 행복 언어치료센터').fill(org.value);
  } else {
    await page.getByRole('button', { name: '코드로 참여' }).click();
    await page.getByPlaceholder('ABCD1234').fill(org.value);
  }

  await page.getByRole('button', { name: '가입 완료' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** 학부모 회원가입 전 과정. 기관 단계가 없어 3단계로 끝난다. */
export async function signUpParent(
  page: Page,
  user: { email: string; name: string; password: string },
) {
  await page.goto('/register');
  await page.getByRole('button', { name: '학부모' }).click();

  await passEmailVerification(page, user.email);
  await fillProfileStep(page, user.name, user.password, '가입 완료');

  await expect(page).toHaveURL(/\/home$/);
}
