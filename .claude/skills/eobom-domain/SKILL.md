---
name: eobom-domain
description: 이어봄 도메인 용어 사전과 네이밍 규칙 — 모든 코드에 일관된 Ubiquitous Language 적용
metadata:
  type: domain-knowledge
  version: "1.0.0"
---

# Eobom Domain Skill

이어봄 프로젝트의 모든 코드에서 아래 규칙을 적용한다.

## 용어 사전 (Notion 1.7 기준)

| 영어 용어 | 한국어 | 정의 |
|-----------|--------|------|
| `Therapist` | 치료사 | 일정 작성 권한을 가진 계정 |
| `Parent` | 학부모 | 일정 조회·확인 권한을 가진 계정 |
| `Child` | 아동 | 치료 대상. 치료사가 소유, 학부모와 N:M 연결 |
| `InviteCode` | 초대 코드 | 치료사가 발급, 학부모가 아동과 연결할 때 사용 |
| `Schedule` | 치료 일정 | 단일 치료 세션. 시작/종료 시각, 상태, 메모 |
| `RecurringRule` | 반복 규칙 | 반복 일정 템플릿. Schedule 생성에 사용 |
| `Notification` | 알림 | 일정 생성/변경/취소 시 학부모에게 생성 |
| `Acknowledgement` | 확인 | 학부모가 일정 변경을 "확인했다"고 표시한 액션 |

## 엔티티 네이밍 규칙

- 이름은 항상 **영어 단수형**: `Child` (not `Children`), `Schedule` (not `Session`)
- 모델명은 PascalCase: `InviteCode`, `RecurringRule`, `ScheduleAcknowledgement`
- DB 테이블명은 snake_case 복수형 (Prisma `@@map` 사용)

## DTO 네이밍 규칙

```
Create<Entity>Dto     예: CreateScheduleDto, CreateChildDto
Update<Entity>Dto     예: UpdateScheduleDto (Partial 기반)
<Entity>ResponseDto   예: ScheduleResponseDto
```

- 모든 DTO는 `packages/shared/src/dto/` 에 정의
- `apps/api` 안에 타입 중복 정의 금지

## 컨트롤러 경로 규칙

- 복수형 케밥케이스: `/schedules`, `/invite-codes`, `/children`
- 중첩 리소스: `/children/:childId/schedules`
- Base URL: `http://localhost:3001/api`

## enum 값 규칙

```typescript
UserRole: THERAPIST | PARENT
ScheduleStatus: SCHEDULED | RESCHEDULED | CANCELED | COMPLETED
InviteCodeStatus: ACTIVE | USED | EXPIRED | REVOKED
NotificationType: SCHEDULE_CREATED | SCHEDULE_UPDATED | SCHEDULE_CANCELED
```

## 한국어 사용 범위

허용: UI 문자열, 코드 주석(WHY 설명)
금지: 변수·함수·클래스·파일명 등 코드 식별자
