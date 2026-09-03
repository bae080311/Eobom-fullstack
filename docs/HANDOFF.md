# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/i18n-app-layer`가 main에 병합 완료(i18n 마이그레이션 4단계 전체 완료 — shared/entities → features → widgets → app).
- Notion 로드맵(레이어 8)이 2026-05-26 이후 갱신되지 않아 코드 대비 크게 낡아 있던 문제를 발견 — architect 에이전트로 레이어 3(도메인 모델)·레이어 8(로드맵)에 `SessionReport`(2026-06-26 머지된 AI 세션 리포트, Ollama 연동)를 뒤늦게 반영. Phase 1~4 상태를 "완료"로, Phase 4.5(계획 외 추가)를 신설.
- Phase 3 잔여 중 **권한·org 스코프 전용 테스트 묶음**을 `test/api-org-scope-guards` 브랜치에서 작성:
  - `invite-codes`·`report` 서비스는 스펙 파일이 아예 없었음(0 test) — 신규 작성(발급/조회/취소/redeem 전체 케이스, THERAPIST 전용 권한, 담당 치료사 무관 org 멤버십 기반 접근 등)
  - `schedules` 서비스의 `update`/`cancel`/`confirm`에 "다른 기관 OWNER 멤버십으로는 접근할 수 없다" 케이스 보강(기존에는 `findOne`에만 있었음 — 세 메서드가 공유하는 `assertCanAccessSchedule` private 헬퍼가 회귀 없이 org-scope를 지키는지 엔드포인트별로 확인)
  - `pnpm --filter api test:coverage` 기준 전체 커버리지 78.7%로 60% 목표 달성 확인
  - Notion 레이어 8 §8.4(Phase 3)를 이 완료 상태로 갱신(e2e만 잔여로 표시)
  - PR #39에 CodeRabbit이 남긴 리뷰 코멘트 4건(모두 "mock이 실제 쿼리 인자를 검증하지 않아 회귀를 못 잡을 수 있다" 계열) 전부 반영 — `updateMany`/`findFirst`/`findUnique` 호출 인자 assertion 추가, "다른 기관 OWNER" 케이스 3건은 org1 실제 멤버십 + org2 조건부 null을 반환하는 `mockImplementation`으로 교체
- 세션 시작 시 `.claude/skills/git-ship/SKILL.md`에 커밋되지 않은 변경(같은 레이어 내 대규모 작업의 슬라이스 그룹 분리 원칙 추가)이 남아있던 것을 발견 — 이번 작업과 무관해 stash로 보존만 해두고 건드리지 않음(`git stash list`에서 확인 가능, 다음 세션에서 처리 필요).

## 다음 작업 후보 (우선순위 순)

1. **Playwright e2e 시나리오 (Phase 3 마지막 잔여)** — 저장소에 Playwright 자체가 설치돼 있지 않음. 🅰️ 기관 셋업, 🅱️ 일정 공유 두 시나리오(레이어 5 §5.12) 구성 필요. 브라우저 자동화 도구가 없는 환경이면 설치·설정만이라도 우선 진행 검토.
2. **`.claude/skills/git-ship/SKILL.md` 미커밋 변경 처리** — `git stash list`에 보존된 커밋 분리 원칙 추가분(메모리 `feedback_commit_splitting`과 동일 내용)을 별도 chore 커밋으로 정리할지 확인 필요.
3. **Phase 4.5 SessionReport 웹 UI 연동** — 백엔드(`POST/GET /schedules/:scheduleId/report*`, Ollama 연동)는 완료됐으나 `features`/`widgets`에 대응 슬라이스가 전무. 치료사 작성 화면·학부모 열람 화면·알림 연동 여부 범위 결정부터 필요(architect 판단 권장, Notion 8.7 Decision Log 리스크 항목 참고).
4. i18n 브라우저 육안 확인, WCAG AA 육안 확인 — Docker/브라우저 자동화 도구가 이 환경에 없어 계속 미착수. 실제 두 번째 로케일 도입 여부도 별도 결정 필요.
5. Phase 5(Ops) 전체 미착수: `ci.yml` 하나만 존재, Sentry/OpenTelemetry·배포 설정(Vercel/컨테이너)·레이트리밋·joinCode 회전 감사 로그 없음.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. Notion 로드맵(레이어 8)은 이번 세션에 최신 상태로 갱신됨 — 다음 세션은 이 문서와 함께 로드맵을 바로 참고해도 됨.
