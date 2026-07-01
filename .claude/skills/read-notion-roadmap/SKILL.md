---
name: read-notion-roadmap
description: Notion 9개 레이어 문서를 읽어 현재 구현 상태와 다음 작업을 파악한다
metadata:
  type: research
  version: "1.0.0"
---

# Read Notion Roadmap Skill

이어봄 Notion 레이어 문서 전체를 읽고, 현재 구현 완료된 것과 **바로 다음에 구현해야 할 기능**을 식별한다.

## 실행 순서

### 1단계 — 로드맵 읽기 (필수)

먼저 레이어 8 (로드맵)을 읽어 Phase와 백로그 전체 구조를 파악한다.

```
Notion URL: https://baekyungjin.notion.site/367085d59d5e81a99ffceccbf859884f
```

### 2단계 — 현재 Phase의 미완료 항목 식별

로드맵에서 현재 진행 중인 Phase를 찾고, 완료 표시가 없는 항목을 목록화한다.

### 3단계 — 관련 레이어 문서 심층 읽기

미완료 항목에 해당하는 레이어를 읽는다.

| 레이어          | URL                                                              | 언제 읽나          |
| --------------- | ---------------------------------------------------------------- | ------------------ |
| 3. 도메인 모델  | https://baekyungjin.notion.site/367085d59d5e8184bf6af98ce245eda9 | 항상               |
| 4. 데이터베이스 | https://baekyungjin.notion.site/367085d59d5e813e818deceb3c31187e | DB 변경 시         |
| 5. API 설계     | https://baekyungjin.notion.site/367085d59d5e81b088e6cae1a76f93ed | 백엔드 작업 시     |
| 6. Web 설계     | https://baekyungjin.notion.site/367085d59d5e8101b081d2396cb807a0 | 프론트엔드 작업 시 |

### 4단계 — 코드베이스 현황 대조

다음 명령으로 실제 구현 상태를 확인한다.

```bash
# 기존 모듈 목록
ls apps/api/src/modules/
ls apps/web/src/features/ 2>/dev/null || ls apps/web/app/ 2>/dev/null

# 최근 커밋 확인
git log --oneline -10
```

### 5단계 — 결과 출력

다음 형식으로 출력한다:

```
## 현재 상태
- 완료: [항목 목록]
- 미완료: [항목 목록]

## 다음 작업 (1순위)
- 작업명: <기능명>
- 레이어: API / Web / Both
- 관련 Notion: <URL>
- 구현 범위:
  - [ ] 항목 1
  - [ ] 항목 2
  - [ ] 항목 3

## 참고 제약
- [네이밍·아키텍처 제약 등]
```

## 중요 규칙

- Notion 문서가 항상 정본이다. 코드와 불일치 시 Notion 기준으로 판단한다.
- 완료 기준: Notion에 ✅ 표시 **또는** 해당 PR이 main에 머지된 경우.
- 동시에 2개 이상 작업을 선택하지 않는다. 1개만 골라 집중한다.
