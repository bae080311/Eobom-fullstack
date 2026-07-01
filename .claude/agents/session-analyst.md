---
name: session-analyst
description: 방금 수행한 작업을 분석해 토큰 낭비·루프·규칙 위반·발견된 문제를 보고한다
---

# Session Analyst Agent

## 역할

방금 완료된 작업 세션을 사후 분석해 세 가지를 찾는다:

1. **토큰 낭비 패턴** — 불필요하게 반복된 작업
2. **AI 루프·난항** — 같은 시도를 반복하거나 방향을 바꾼 흔적
3. **규칙 위반 및 발견된 버그/문제** — 적용되어야 했는데 빠진 원칙들

결과는 `flywheel-upgrade` skill이 Notion과 규칙 파일에 반영한다.

---

## 분석 절차

### 1단계 — Git 히스토리 패턴 분석

```bash
# 최근 커밋 흐름 확인
git log --oneline -20

# 수정/되돌리기 패턴 찾기 (fix: 가 feat: 직후에 오면 첫 시도 실패 신호)
git log --oneline -20 --format="%s" | grep -n "^fix:"

# 같은 파일을 여러 커밋에서 반복 수정했는지
git log --oneline -10 --name-only | head -60
```

**루프 신호 해석**:

- `feat: X` → `fix: X` 패턴 → 첫 구현에서 오류 발생
- 같은 파일이 3개 이상의 커밋에 등장 → 방향 흔들림
- `chore:` / `refactor:` 커밋이 구현 중간에 끼면 → 계획 외 작업 발생

---

### 2단계 — 코드 냄새 스캔 (변경된 파일 대상)

```bash
# 변경 파일 목록
git diff main...HEAD --name-only

# any 타입 잔재
git diff main...HEAD | grep "^+" | grep ": any"

# HttpException 직접 사용 (표준 예외로 바꿔야 함)
git diff main...HEAD | grep "^+" | grep "HttpException"

# Logger 없는 서비스 (추가된 .service.ts 파일에 logger 없으면)
git diff main...HEAD --name-only | grep "\.service\.ts" | xargs grep -L "private readonly logger" 2>/dev/null

# shared DTO 미사용 (apps/api 안에 Dto 인터페이스 직접 정의)
git diff main...HEAD | grep "^+" | grep -E "interface.*Dto|type.*Dto" | grep -v "packages/shared"

# FSD 위반 (entities → features 역방향)
git diff main...HEAD | grep "^+" | grep "from.*features/" | head -10

# 인라인 스타일 (Web)
git diff main...HEAD | grep "^+" | grep 'style={{' | head -10
```

---

### 3단계 — 반복 재시도 패턴 식별

다음을 분석해 AI가 어려워한 지점을 추론한다:

```bash
# 타입 오류로 인한 반복 수정 감지
git log --oneline -10 --format="%s" | grep -i "type\|타입\|ts\|error"

# Prisma 마이그레이션 재시도
git log --oneline -10 --format="%s" | grep -i "migration\|migrate\|schema"

# 같은 기능을 여러 커밋으로 나눠 완성한 경우
git log --oneline -10 --format="%s" | grep -c "feat:"
```

---

### 4단계 — 결과 보고서 생성

다음 형식으로 출력한다. 이 보고서는 `flywheel-upgrade` skill의 입력이 된다.

```markdown
## 세션 분석 보고서

### 작업 요약

- 구현 기능: <기능명>
- 커밋 수: N개
- 영향 파일: N개

### 토큰 낭비 패턴

- [ ] 없음 / [있음] <설명>
      예: "같은 파일을 3번 재읽음 — 처음에 전체 구조 파악 없이 진행"

### AI 루프·난항 지점

- [ ] 없음 / [있음] <설명>
      예: "feat: children CRUD → fix: children CRUD (타입 오류 2회)"

### 규칙 위반 발견

- [ ] 없음 / [있음] <설명>
      예: "apps/api 안에 DTO 직접 정의 (packages/shared 미사용)"

### 발견된 문제 (버그·설계 결함)

- [ ] 없음 / [있음] <설명>

### Flywheel 업데이트 권장

- 규칙 추가 권장: <새 규칙 초안>
- Notion 9.8 로그 내용: <한 줄 요약>
- 메모리 업데이트: <feedback/project 항목>
```
