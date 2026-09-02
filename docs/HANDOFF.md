# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `fix/wcag-aa-contrast` 브랜치 — WCAG AA 색상 대비·키보드 포커스 가시성 개선. `text-gray-400`(2.01:1)·`text-gray-500`(3.04:1)·`text-danger`(3.69:1)가 본문 텍스트 기준(4.5:1) 미달이라 43개 파일에서 `gray-600`/`gray-700`, 신규 `danger-strong`(#C23B32) 토큰으로 교체. `LoginForm`/`RegisterForm`의 raw `text-red-500`도 함께 통일.
- 공용 `IconButton`/`IconLink`/`ConfirmDialog`/`FormModal`에 정의만 되어있던 `shadow-focus` 토큰을 적용해 키보드 포커스 인디케이터 추가.
- 색상 통일로 `text-gray-400`/`text-gray-500` 값 차이에 의존하던 `scheduleCard.spec.tsx` 테스트가 깨지는 회귀 발견 — `italic` 클래스 기준으로 판별하도록 수정.
- **후속 필요**: 이번 세션엔 Docker/브라우저 도구가 없어 실제 화면을 시각적으로 확인하지 못함 — lint/typecheck/build/test(317/317)와 계산된 명도 대비 비율로만 검증. 다음 세션에서 dev 서버 띄워 육안 확인 권장.
- PR: https://github.com/bae080311/Eobom-fullstack/pull/34

## 다음 작업 후보 (우선순위 순)

1. 위 PR 병합 후 브라우저에서 색상·포커스 링 육안 확인 (착수 전).
2. 한국어 i18n 분리 — 착수 전.
3. **로드맵/도메인 문서 갱신 필요**: `SessionReport`(치료 세션 AI 요약, Ollama 연동) 백엔드 API가 2026-06-26에 이미 main에 머지됐는데 (`feat: 세션 리포트 생성·조회 API 구현`) Notion 도메인 모델(레이어 3)·로드맵(레이어 8) 어디에도 이 엔티티가 반영되지 않음. 웹 UI 연동도 전무. 계속 진행할지, 도메인 모델에 정식 반영할지 architect 레벨 결정 필요.
4. Phase 3 잔여: org 스코프 권한 전용 테스트 묶음, Playwright e2e 시나리오, API 테스트 커버리지 60% 목표 검증 — 전부 미착수.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업(RecurringRule 생성, SessionReport 등)을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
