# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/child-primary-therapist-reassign` 브랜치 — 아동 담당 치료사(`primaryTherapist`) 재지정 UI 구현. `entities/child`에 `useSetPrimaryTherapist` 뮤테이션 훅, `features/manage-child`에 `SetPrimaryTherapistForm` 모달을 추가하고 `TherapistChildActions`에 "담당변경" 액션으로 연결(기관 멤버가 있을 때만 노출). `widgets/child-detail`에는 현재 담당 치료사 표시 행 추가.
- 구현 중 발견한 blocker를 함께 해결: `POST /children/:id/primary-therapist`가 요구하는 `TherapistProfile.id`를 `GET /organizations/:orgId/members` 응답이 노출하지 않아 재지정 드롭다운을 만들 수 없었음 → `MemberResponseDto`에 `therapistProfileId` 필드 추가(스키마 변경 아님, 응답 DTO 확장). `organizations.service.ts`의 `toMemberDto` 및 관련 API/웹 테스트 fixture 갱신.
- Notion 레이어 5(API 설계) 5.5/5.6, 레이어 6(Web 설계) 갱신 — "아동 primary-therapist 재지정 UI"를 v0.2 예정 목록에서 제거.
- PR: https://github.com/bae080311/Eobom-fullstack/pull/30

## 다음 작업 후보 (우선순위 순)

1. **역할별 라우팅 개선** — 미들웨어의 수동 JWT 디코딩(`decodeRole`/`isTokenExpired`)과 `(owner)/layout.tsx`의 API 기반 멤버십 가드가 서로 다른 층에 분리되어 있음. JWT 파싱을 유틸화하고 두 가드 메커니즘을 통합하는 리팩터링 필요(Notion 레이어 6 v0.2 예정 참고).
2. `/redeem`(학부모 초대코드 입력), 치료사 `invite-codes`(발급 코드 목록) 페이지 — 착수 전.
3. WCAG AA 검토, 한국어 i18n 분리 — 착수 전.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
