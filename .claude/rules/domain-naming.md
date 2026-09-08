# 도메인 네이밍 규칙

코드 식별자(변수·함수·클래스·파일명)는 아래 영어 용어만 사용한다. 한국어는 UI 문자열·주석에만.

## 엔티티 이름

| 사용               | 금지                          |
| ------------------ | ----------------------------- |
| `Therapist`        | ~~치료사, Therapist~~s        |
| `Parent`           | ~~학부모~~                    |
| `Child`            | ~~Children, Patient~~         |
| `InviteCode`       | ~~Code, Invitation~~          |
| `Schedule`         | ~~Session, Appointment~~      |
| `RecurringRule`    | ~~Repeat, Recurring~~         |
| `Notification`     | ~~Alert, Message~~            |
| `Acknowledgement`  | ~~Confirm, Read~~             |
| `SessionReport`    | ~~Report, Summary, AiReport~~ |
| `JoinCodeRotation` | ~~CodeRotation, AuditLog~~    |

## DTO 이름

```
Create<Entity>Dto   UpdateScheduleDto   ScheduleResponseDto
```

## 컨트롤러 경로

복수형 케밥케이스: `/schedules` `/invite-codes` `/children`

## enum 값

정본은 `packages/shared/src/enums/index.ts` 하나다. Prisma·NestJS·Next.js가 이 값을 재사용한다.

```typescript
UserRole: THERAPIST | PARENT;
OrgMemberRole: OWNER | THERAPIST;
OrgMembershipStatus: ACTIVE | LEFT;
ParentRelation: MOTHER | FATHER | GUARDIAN | OTHER;
InviteCodeType: THERAPIST_JOIN | PARENT_LINK;
InviteCodeStatus: ACTIVE | USED | EXPIRED | REVOKED;
ScheduleStatus: SCHEDULED | RESCHEDULED | CANCELED | COMPLETED;
NotificationType: SCHEDULE_CREATED |
  SCHEDULE_UPDATED |
  SCHEDULE_CANCELED |
  SESSION_REPORT_CREATED;
```

> 철자는 미국식 한 글자 L(`CANCELED`)로 통일한다. `CANCELLED`·`MODIFIED`는 쓰지 않는다.
