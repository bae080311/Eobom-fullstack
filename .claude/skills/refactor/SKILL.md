---
name: refactor
description: 지정된 범위의 코드를 분석하고 우선순위에 따라 리팩토링을 적용한다
metadata:
  type: process
  version: "1.0.0"
---

# Refactor Skill

코드 냄새를 찾아 우선순위를 매기고, `refactoring-expert` 에이전트를 통해 실제 수정을 적용한다.

## 트리거

- `/refactor` 커맨드 (인자 없으면 변경된 파일 전체 스캔)
- `/refactor <경로>` — 특정 파일·모듈만 대상

## 파이프라인

```
scan → prioritize → apply → validate
```

---

## 1단계: 스캔

인자가 있으면 해당 경로만, 없으면 `git diff main...HEAD`의 변경 파일을 대상으로 한다.

```bash
# 변경 파일 확인
git diff main...HEAD --name-only

# any 타입 찾기
grep -rn ": any" apps/ packages/ --include="*.ts" --include="*.tsx"

# 중복 DTO 의심 (shared 미사용)
grep -rn "interface.*Dto\|type.*Dto" apps/api/src --include="*.ts"

# HttpException 직접 사용
grep -rn "HttpException" apps/api/src --include="*.ts"

# Logger 누락 서비스
grep -rL "private readonly logger" apps/api/src/modules --include="*.service.ts"

# FSD 역방향 임포트 의심 (entities에서 features 임포트)
grep -rn "from.*features/" apps/web/src/entities --include="*.ts" --include="*.tsx"

# 미사용 임포트 (eslint가 잡지 못한 경우 대비)
grep -rn "^import" apps/ packages/ --include="*.ts" | head -50
```

---

## 2단계: 우선순위 매기기

스캔 결과를 다음 기준으로 정렬해 목록을 출력한다:

```
## 리팩토링 대기 목록

### 즉시 (높음)
- [ ] <파일>:<줄> — any 타입 → 구체적 타입으로 교체
- [ ] <파일>:<줄> — 중복 DTO → packages/shared 사용

### 다음 (중간)
- [ ] <파일>:<줄> — HttpException → NotFoundException
- [ ] <파일>:<줄> — Logger 누락

### 나중에 (낮음)
- [ ] <파일>:<줄> — 긴 함수 분리
- [ ] <파일>:<줄> — 미사용 임포트
```

---

## 3단계: 적용

`refactoring-expert` 에이전트에 위임한다. 높음 → 중간 → 낮음 순서로 적용한다.

**파일 5개 초과 시**: 높음 항목만 먼저 적용하고, 검증 후 나머지를 별도 실행한다.

---

## 4단계: 검증

```bash
pnpm lint && pnpm typecheck && pnpm test
```

통과하면 완료 보고. 실패하면:

1. 실패 원인 파악
2. 해당 변경만 `git checkout -- <file>` 로 원복
3. 원인 보고 후 중단

---

## 완료 보고 형식

```
## 리팩토링 완료

### 적용된 변경
- [x] foo.service.ts — any → User 타입
- [x] bar.controller.ts — HttpException → NotFoundException

### 건너뛴 항목 (이유)
- [ ] baz.ts — 테스트 없어 구조 변경 보류

### 검증
- lint ✅ / typecheck ✅ / test ✅

### 다음 권장 작업
<중간·낮음 우선도 항목 요약>
```
