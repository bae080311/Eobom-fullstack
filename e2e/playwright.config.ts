import { defineConfig, devices } from '@playwright/test';

/**
 * e2e 설정 — 레이어 5 §5.12에 따라 시나리오는 레이어 1 §1.4 MVP 흐름과 1대일 대응한다.
 *
 * 전제: `docker compose -f docker-compose.test.yml up -d` 로 테스트 DB(5434)가 떠 있어야 한다.
 * web(3000)·api(3001)는 아래 webServer 설정이 직접 기동한다.
 */

const TEST_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://eobom:eobom_password@localhost:5434/eobom_test';

const WEB_PORT = 3000;
const API_PORT = 3001;

// api·web 프로세스에 넘길 공통 환경변수. 개발용 .env(5432)를 덮어써 테스트 DB를 향하게 한다.
const serverEnv = {
  DATABASE_URL: TEST_DATABASE_URL,
  NODE_ENV: 'test',
  JWT_SECRET: 'e2e-test-secret',
  JWT_EXPIRES_IN: '1h',
  API_PORT: String(API_PORT),
  WEB_PORT: String(WEB_PORT),
  WEB_URL: `http://localhost:${WEB_PORT}`,
  NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api`,

  // 회원가입은 인증 코드 발송이 성공해야 다음 단계로 넘어간다(RegisterForm step2 → 2.5).
  // docker-compose.test.yml의 mailpit으로 보내 실제 메일 없이 통과시킨다.
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  // mailpit은 MP_SMTP_AUTH_ACCEPT_ANY로 아무 credential이나 받는다.
  // 빈 값으로 두면 nodemailer가 AUTH PLAIN을 시도하다 'Missing credentials'로 실패한다.
  SMTP_USER: 'e2e',
  SMTP_PASS: 'e2e',
  EMAIL_FROM: 'e2e@eobom.test',
};

export default defineConfig({
  testDir: '.',
  outputDir: './.artifacts',

  // 시나리오가 같은 테스트 DB를 공유하므로 병렬 실행하지 않는다.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      command: 'pnpm --filter @eobom/api dev',
      cwd: '..',
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: serverEnv,
    },
    {
      command: 'pnpm --filter @eobom/web dev',
      cwd: '..',
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: serverEnv,
    },
  ],
});
