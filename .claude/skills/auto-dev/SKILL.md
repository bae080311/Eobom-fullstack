---
name: auto-dev
description: Notion 로드맵을 읽고 다음 기능을 자동으로 구현·커밋·푸시·PR까지 완료한다
metadata:
  type: orchestrator
  version: "1.0.0"
---

# Auto Dev Skill

Notion 레이어 문서를 읽고, 다음으로 구현해야 할 기능을 선택해 끝까지 자동 완료한다.

## 트리거

- `/auto-dev` 커맨드 실행 시
- 사용자가 "알아서 다음 기능 개발해줘" 요청 시

## 파이프라인

```
read-notion-roadmap → plan → implement → validate → git-ship → reflect
```

---

## 1단계: 컨텍스트 로딩 (read-notion-roadmap skill 호출)

`read-notion-roadmap` skill을 실행해 다음을 파악한다:

- 현재 Phase와 완료된 항목
- **바로 다음에 구현할 1개 기능**
- 관련 Notion 레이어 URL

---

## 2단계: 구현 계획 수립

`read-notion-roadmap` 결과를 바탕으로 구현 아웃라인을 작성한다.

아웃라인 형식:

```
## 구현 아웃라인: <기능명>

### 생성할 파일
- [ ] apps/api/src/modules/xxx/xxx.module.ts
- [ ] apps/api/src/modules/xxx/xxx.controller.ts
- [ ] apps/api/src/modules/xxx/xxx.service.ts
- [ ] packages/shared/src/dto/xxx.dto.ts

### 수정할 파일
- [ ] apps/api/src/app.module.ts

### DB 변경 여부
- [ ] 있음 (prisma-migration skill 필요)
- [x] 없음

### 에이전트 선택
- [ ] api-engineer (백엔드)
- [ ] web-engineer (프론트엔드)
- [ ] 둘 다
```

**아웃라인을 사용자에게 출력한 뒤 5초 대기 없이 바로 구현을 시작한다.**

---

## 3단계: 구현

기능 레이어에 따라 적절한 에이전트에 위임한다.

### 백엔드 기능 (API)

`api-engineer` 에이전트에 다음을 포함한 지시 전달:

- 구현할 기능명과 Notion URL
- 생성/수정할 파일 목록
- eobom-domain skill 적용 (네이밍 일관성)
- prisma-migration skill 적용 (DB 변경 시)

### 프론트엔드 기능 (Web)

`web-engineer` 에이전트에 다음을 포함한 지시 전달:

- 구현할 기능명과 Notion URL
- FSD 레이어 구조 준수
- RSC 우선, TanStack Query 연동

### 양쪽 모두

백엔드 → 검증 → 프론트엔드 순서로 직렬 실행한다.

---

## 4단계: 검증

구현 완료 후 반드시 다음 명령을 실행한다:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

실패 시:

- 에러 메시지를 분석해 코드 수정
- 수정 후 재실행
- 3회 시도 후에도 실패 시 사용자에게 보고하고 중단

---

## 5단계: git-ship skill 호출

검증 통과 후 `git-ship` skill을 실행해 커밋·푸시·PR 생성을 완료한다.

---

## 6단계: reflect skill 호출

PR 생성 완료 직후 `reflect` skill을 자동 실행한다.
이번 세션의 토큰 낭비·루프·규칙 위반을 분석하고 Flywheel을 업그레이드한다.

---

## 완료 보고

```
## Auto Dev 완료

- 구현 기능: <기능명>
- PR: <PR URL>
- 검증: lint ✅ / typecheck ✅ / test ✅
- Flywheel: 업데이트됨

### 다음 작업 예고
<read-notion-roadmap 기준 다음 순위 항목>
```

---

## 원칙

1. **Notion이 정본** — 코드와 충돌 시 Notion 기준으로 구현한다.
2. **1 PR = 1 기능** — 여러 기능을 한 PR에 혼합하지 않는다.
3. **검증 없이 PR 금지** — lint/typecheck/test 모두 통과해야 git-ship 호출 가능.
4. **도메인 네이밍** — eobom-domain skill의 용어 사전을 항상 따른다.
5. **CLAUDE.md Flywheel 규칙** — 작업 전 영향받는 Notion 레이어를 먼저 읽는다.
