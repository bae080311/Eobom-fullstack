# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/invite-code-web-ui` 브랜치 — 초대코드 웹 UI 구현. `entities/invite-code`(fetch/mutation 훅, 상태 배지·행 UI), `features/{issue,revoke,use}-invite-code`, `widgets/invite-code-list` 신규 슬라이스와 `(therapist)/invite-codes`·`(parent)/redeem` 페이지 추가. 진입점은 `/children` 상단바·아동 상세 화면·`/me` 메뉴(학부모).
- PR 리뷰로 발견·수정: `InviteCode.status`는 redeem 시도 시점에만 EXPIRED로 갱신되어 미사용 상태로 유효기간이 지난 코드가 서버 응답에서도 ACTIVE로 남는 문제 — `getEffectiveInviteCodeStatus`로 프론트에서 `expiresAt` 기준 재판정. 담당 배정이 바뀌어 `findAllForTherapist`에서 빠진 아동의 기존 발급 코드가 화면에서 사라지던 문제 — `items`(현재 담당 아동) ∪ `codes`의 child를 합쳐 그룹핑하되 발급 버튼은 현재 담당 아동에만 노출.
- 백엔드(`invite-codes` 모듈)는 이미 구현되어 있어 변경 없음.
- Notion 레이어 6(Web 설계) 갱신 — `/redeem`·`/invite-codes`를 v0.2 예정에서 완료로 반영.
- PR: https://github.com/bae080311/Eobom-fullstack/pull/32

## 다음 작업 후보 (우선순위 순)

1. WCAG AA 검토, 한국어 i18n 분리 — 착수 전.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
