---
name: flywheel-upgrade
description: session-analyst 보고서를 받아 Notion·규칙 파일·메모리를 자동 업데이트한다
metadata:
  type: process
  version: "1.0.0"
---

# Flywheel Upgrade Skill

`session-analyst`가 생성한 보고서를 입력으로 받아 세 곳을 자동 업데이트한다:

1. **Notion 9.8 Flywheel Log** — 세션 한 줄 기록
2. **`.claude/rules/*.md`** — 반복되는 패턴을 새 원칙으로 추가
3. **메모리 파일** — feedback / project 메모리 저장

---

## 판단 기준: 언제 무엇을 업데이트하나

| 발견 유형                | 심각도 | 업데이트 대상                  |
| ------------------------ | ------ | ------------------------------ |
| 규칙 위반 첫 발생        | 낮음   | Notion 9.8 로그만              |
| 규칙 위반 2회 이상       | 높음   | 규칙 파일 + Notion + 메모리    |
| 새 패턴 발견 (규칙 없음) | 중간   | 규칙 파일 초안 추가 + Notion   |
| AI 루프·토큰 낭비        | 중간   | 해당 agent/skill 파일 + 메모리 |
| 버그·설계 결함           | 높음   | 이슈 메모리 + Notion           |

---

## 실행 순서

### 1단계 — Notion 9.8 Flywheel Log 기록

Notion MCP를 사용해 Flywheel Log 페이지에 한 줄을 추가한다.

Notion URL: https://baekyungjin.notion.site/367085d59d5e81c287a5dc3838527446

추가 형식:

```
[YYYY-MM-DD] <기능명> — <배운 것 한 줄> | 토큰낭비: <있음/없음> | 루프: <있음/없음>
```

예시:

```
[2026-07-01] children CRUD — 첫 구현 시 shared DTO 확인 안 하고 로컬 정의함 | 토큰낭비: 없음 | 루프: 있음(타입오류 2회)
```

---

### 2단계 — 규칙 파일 업데이트 (해당하는 경우)

보고서에서 "2회 이상 반복" 또는 "새 패턴" 항목이 있으면 아래 파일에 추가한다.

| 대상 파일                           | 적용 범위                                   |
| ----------------------------------- | ------------------------------------------- |
| `.claude/rules/02-api-structure.md` | NestJS·DTO·Logger 관련                      |
| `.claude/rules/03-web-structure.md` | FSD·컴포넌트·스타일 관련                    |
| `.claude/rules/01-domain-naming.md` | 네이밍 관련                                 |
| `.claude/rules/05-dev-process.md`   | 개발 프로세스·체크리스트 (없으면 새로 생성) |

새 규칙 추가 형식 (기존 파일 맨 끝에 추가, 덮어쓰기 금지):

```markdown
## [자동 추가 YYYY-MM-DD] <규칙 제목>

- <구체적 규칙 내용>
- 발견 경위: <세션 분석에서 N회 위반 감지>
```

---

### 3단계 — 에이전트·스킬 파일 업데이트 (AI 루프 발생 시)

AI가 어려워한 지점이 특정 에이전트의 행동 원칙 부재 때문이면
`.claude/agents/<해당-agent>.md`의 행동 원칙 또는 금지 섹션에 추가한다.

예: `api-engineer`가 매번 shared DTO를 확인하지 않으면:

> "구현 시작 전 `packages/shared/src/dto/` 목록을 먼저 확인해 재사용 가능한 DTO가 있는지 검색한다."

---

### 4단계 — 메모리 저장

- **feedback 메모리** (반복 실수·교정): `~/.claude/projects/<project-hash>/memory/feedback_<주제>.md` (활성 Claude 프로젝트 메모리 경로)
- **project 메모리** (발견된 설계 결함·이슈): `~/.claude/projects/<project-hash>/memory/project_<기능>.md` (활성 Claude 프로젝트 메모리 경로)

MEMORY.md 인덱스도 함께 업데이트한다.

---

## 완료 보고

```
## Flywheel 업그레이드 완료

- Notion 9.8 로그: 추가됨
- 규칙 파일 업데이트: <있음 / 없음> — <파일명>
- 에이전트 파일 업데이트: <있음 / 없음> — <파일명>
- 메모리 저장: <있음 / 없음> — <파일명>

다음 세션을 위한 한 줄: <이번 세션에서 배운 것>
```

---

## 주의

- 규칙 파일 수정 시 기존 내용을 삭제하거나 덮어쓰지 않는다. 항상 끝에 추가만 한다.
- Notion 업데이트 실패 시 로컬 메모리에만 저장하고 계속 진행한다.
- 심각도 낮음 항목이 5개 이상 쌓이면 일괄 규칙화를 제안한다.
