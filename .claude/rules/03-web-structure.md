# Web (Next.js + FSD) 구현 규칙

## FSD 레이어 구조

```
apps/web/
  app/                     # Next.js App Router (라우팅만 담당)
    (marketing)/
    (auth)/
    (therapist)/
    (parent)/
  src/
    widgets/               # 독립적인 복합 UI 블록
    features/              # 사용자 인터랙션 단위 (액션 + UI)
    entities/              # 도메인 엔티티 (model, ui, api)
    shared/                # 재사용 기반 (ui-kit, api-client, lib, types)
```

## 레이어 책임

| 레이어 | 예시 | 의존 가능 |
|--------|------|-----------|
| `widgets` | `ScheduleCalendar`, `NotificationList` | features, entities, shared |
| `features` | `create-schedule`, `confirm-schedule`, `use-invite-code` | entities, shared |
| `entities` | `schedule`, `child`, `notification` | shared |
| `shared` | `ui/`, `api/`, `lib/`, `types/` | 없음 |

**상위 레이어는 하위 레이어만 임포트한다. 역방향 의존 금지.**

## 슬라이스 내부 구조

```
features/create-schedule/
  ui/          # 컴포넌트
  model/       # 상태·훅
  api/         # API 호출
  index.ts     # public API (외부에서 이 파일만 임포트)
```

각 슬라이스는 `index.ts`만 공개한다. 내부 파일 직접 임포트 금지.

## 데이터 페칭

- 기본 조회 → **Server Component** fetch (쿠키 기반 JWT)
- 상호작용·mutation → `'use client'` + **TanStack Query**
- `useEffect`로 데이터 fetch 금지

## 라우트 그룹

```
(marketing)  비로그인 공개
(auth)       로그인·회원가입
(therapist)  role=THERAPIST 전용 — 레이아웃에서 롤 가드
(parent)     role=PARENT 전용
```

## 스타일·컴포넌트

- 인라인 `style={{}}` 금지 → Tailwind 클래스만
- `shadcn/ui`는 `shared/ui/`에 설치 후 전체 공유
- 날짜 표시: `"MM월 DD일 (요일) HH:mm"` 형식 고정

## 금지

- 레이어 역방향 임포트 (예: `entities`에서 `features` 임포트)
- 슬라이스 내부 파일 직접 임포트 (`index.ts` 우회)
- 클라이언트에서 직접 DB 접근
- 하드 액션(삭제·취소) 확인 모달 없이 실행
