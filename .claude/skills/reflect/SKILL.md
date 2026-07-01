---
name: reflect
description: 방금 완료한 작업을 분석하고 Flywheel을 자동 업그레이드한다
metadata:
  type: orchestrator
  version: "1.0.0"
---

# Reflect Skill

작업 완료 후 호출하는 사후 분석 파이프라인.
`session-analyst`로 분석하고 `flywheel-upgrade`로 자동 반영한다.

## 트리거

- `/reflect` 커맨드 실행 시
- `auto-dev` 파이프라인이 PR 생성 완료한 직후 자동 호출
- 사용자가 "이번 작업 돌아봐줘", "플라이휠 업데이트해줘" 요청 시

---

## 파이프라인

```
session-analyst → flywheel-upgrade
```

---

## 1단계: session-analyst 실행

`session-analyst` 에이전트를 호출해 다음을 분석한다:

- 방금 완료된 커밋 히스토리의 루프 패턴
- 변경 파일의 코드 냄새 (any, 중복 DTO, HttpException 직접 사용 등)
- AI가 어려워한 지점 추론

인자가 있으면 해당 기능명을 컨텍스트로 전달한다.

---

## 2단계: flywheel-upgrade 실행

`session-analyst` 보고서를 입력으로 `flywheel-upgrade` skill을 실행한다:

- 발견 심각도에 따라 Notion / 규칙 파일 / 메모리 자동 업데이트
- 에이전트 파일 개선 (루프 발생 원인이 에이전트 지시 부재인 경우)

---

## 최종 출력

```
## Reflect 완료

### 이번 작업 요약
- 기능: <기능명>
- 토큰 낭비: <있음 / 없음>
- AI 루프: <있음 / 없음>
- 규칙 위반: <있음 / 없음>

### Flywheel 업데이트
- Notion 9.8: 기록됨
- 규칙 파일: <변경 내용 or 없음>
- 메모리: <변경 내용 or 없음>

### 다음 세션 권장 사항
<구체적인 한 두 문장>
```

---

## auto-dev와의 연동

`auto-dev` skill의 파이프라인 마지막에 reflect가 자동으로 실행되어야 한다:

```
read-notion-roadmap → plan → implement → validate → git-ship → reflect
```

이를 통해 모든 자동 개발 세션이 끝나면 Flywheel이 항상 업데이트된다.
