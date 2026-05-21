# 이어봄 — Claude Code 컨텍스트

언어치료사·학부모 치료 스케줄 공유 PWA. `web:3000` / `api:3001` / `postgres:5432`

## 시작

```bash
cp .env.example .env && docker compose up -d && pnpm install && pnpm db:migrate && pnpm dev
```

## Notion 레이어 문서 (정본)

| # | 레이어 | URL |
|---|--------|-----|
| 1 | 제품 | https://baekyungjin.notion.site/367085d59d5e81d3ac90ce8b2446e376 |
| 2 | 아키텍처 | https://baekyungjin.notion.site/367085d59d5e817cadd0e705d5827ccc |
| 3 | 도메인 모델 | https://baekyungjin.notion.site/367085d59d5e8184bf6af98ce245eda9 |
| 4 | 데이터베이스 | https://baekyungjin.notion.site/367085d59d5e813e818deceb3c31187e |
| 5 | API 설계 | https://baekyungjin.notion.site/367085d59d5e81b088e6cae1a76f93ed |
| 6 | Web 설계 | https://baekyungjin.notion.site/367085d59d5e8101b081d2396cb807a0 |
| 7 | DevOps | https://baekyungjin.notion.site/367085d59d5e81cea7d5ceba4d64c0ac |
| 8 | 로드맵 | https://baekyungjin.notion.site/367085d59d5e81a99ffceccbf859884f |
| 9 | 하네스 & Flywheel | https://baekyungjin.notion.site/367085d59d5e81c287a5dc3838527446 |

> 코드 변경과 레이어 문서 업데이트는 **한 PR 안에서 함께** 끝낸다.

## 용어 사전

`Therapist` 치료사 · `Parent` 학부모 · `Child` 아동 · `InviteCode` 초대코드
`Schedule` 치료 세션 · `RecurringRule` 반복 규칙 · `Notification` 알림 · `Acknowledgement` 확인

코드 식별자는 영어만. 한국어는 UI 문자열·주석에만.

## Flywheel 운영 규칙

1. 작업 전 영향받는 Notion 레이어 문서를 먼저 읽는다.
2. 변경 범위를 아웃라인으로 제시하고 승인 후 구현한다.
3. 파일 추가는 소단위로, 메시지당 한 가지 관심사만.
4. 검증 근거: `pnpm lint && pnpm typecheck && pnpm test`
5. 세션에서 배운 것은 Notion 9.8 Flywheel Log에 기록한다.
6. 반복 실수는 이 파일 또는 Notion 9.7에 원칙으로 추가한다.

## 에이전트 / 커맨드

| 에이전트 | 역할 |
|---------|------|
| `architect` | 레이어 경계·Phase 전환·도메인 개념 |
| `api-engineer` | NestJS 모듈·DTO·서비스 |
| `web-engineer` | Next.js 라우트·컴포넌트·폼 |
| `reviewer` | PR 리뷰·보안·테스트 |

`/new-module <name>` · `/add-endpoint <module> <method> <path>` · `/plan-migration <topic>`

## 커밋: `feat` `fix` `docs` `refactor` `test` `chore`
