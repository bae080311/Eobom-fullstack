# 데이터베이스 문서

## 개요

- DBMS: PostgreSQL 16
- ORM: Prisma 6
- 스키마 위치: `/prisma/schema.prisma`

## 엔티티 설명

### User (사용자)

치료사와 학부모 모두 동일한 `User` 테이블을 사용하며 `role` 필드로 구분한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| email | String (unique) | 로그인 이메일 |
| password | String | bcrypt 해시 |
| name | String | 이름 |
| role | UserRole enum | THERAPIST 또는 PARENT |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

### Child (아동)

치료사가 등록하는 아동 정보.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| name | String | 아동 이름 |
| birthDate | DateTime? | 생년월일 (선택) |
| therapistId | String | 담당 치료사 FK |

### ChildParent (아동-학부모 연결)

아동 한 명에 학부모 여러 명이 연결될 수 있는 다대다 관계.

| 필드 | 타입 | 설명 |
|------|------|------|
| childId | String | 아동 FK (복합 PK) |
| parentId | String | 학부모 FK (복합 PK) |
| linkedAt | DateTime | 연결 일시 |

### InviteCode (초대 코드)

치료사가 학부모를 초대하기 위해 생성하는 코드.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| code | String (unique) | 6자리 코드 |
| childId | String | 대상 아동 FK |
| createdById | String | 생성한 치료사 FK |
| expiresAt | DateTime | 만료 시각 |
| usedAt | DateTime? | 사용 시각 (null = 미사용) |

### Schedule (치료 일정)

치료사가 등록하는 치료 일정.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| childId | String | 대상 아동 FK |
| therapistId | String | 담당 치료사 FK |
| startAt | DateTime | 시작 시각 |
| endAt | DateTime | 종료 시각 |
| status | ScheduleStatus | SCHEDULED / CANCELLED / MODIFIED |
| note | String? | 메모 (선택) |
| isRecurring | Boolean | 반복 일정 여부 |
| recurringId | String? | 반복 그룹 ID |

### ScheduleConfirmation (일정 확인)

학부모가 변경된 일정을 확인했음을 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| scheduleId | String | 일정 FK |
| parentId | String | 학부모 FK |
| confirmedAt | DateTime | 확인 시각 |

`scheduleId + parentId` 조합이 unique (한 일정을 한 학부모가 한 번만 확인).

### Notification (알림)

일정 생성/변경/취소 시 학부모에게 생성되는 알림.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | cuid | 기본 키 |
| userId | String | 수신자 FK |
| scheduleId | String? | 관련 일정 FK |
| type | NotificationType | 알림 유형 |
| message | String | 알림 메시지 |
| isRead | Boolean | 읽음 여부 |

## 열거형 (Enum)

```prisma
enum UserRole {
  THERAPIST
  PARENT
}

enum ScheduleStatus {
  SCHEDULED   # 예정
  CANCELLED   # 취소
  MODIFIED    # 변경됨
}

enum NotificationType {
  SCHEDULE_CREATED    # 일정 등록
  SCHEDULE_MODIFIED   # 일정 변경
  SCHEDULE_CANCELLED  # 일정 취소
}
```

## 인덱스 전략

- `users.email` - 로그인 조회
- `children.therapistId` - 치료사별 아동 목록
- `schedules.childId` - 아동별 일정 목록
- `schedules.therapistId` - 치료사별 일정 목록
- `schedules.startAt` - 날짜 범위 조회
- `schedules.recurringId` - 반복 그룹 조회
- `invite_codes.code` - 코드 조회
- `notifications.userId + isRead` - 미읽음 알림 조회

## 주요 명령어

```bash
# 개발 DB 마이그레이션
pnpm db:migrate

# 스키마 변경 후 클라이언트 재생성
pnpm db:generate

# DB 초기화 (개발용)
pnpm db:reset

# Prisma Studio (DB GUI)
pnpm db:studio
```
