# 도메인 네이밍 규칙

코드 식별자(변수·함수·클래스·파일명)는 아래 영어 용어만 사용한다. 한국어는 UI 문자열·주석에만.

## 엔티티 이름

| 사용 | 금지 |
|------|------|
| `Therapist` | ~~치료사, Therapist~~s |
| `Parent` | ~~학부모~~ |
| `Child` | ~~Children, Patient~~ |
| `InviteCode` | ~~Code, Invitation~~ |
| `Schedule` | ~~Session, Appointment~~ |
| `RecurringRule` | ~~Repeat, Recurring~~ |
| `Notification` | ~~Alert, Message~~ |
| `Acknowledgement` | ~~Confirm, Read~~ |

## DTO 이름

```
Create<Entity>Dto   UpdateScheduleDto   ScheduleResponseDto
```

## 컨트롤러 경로

복수형 케밥케이스: `/schedules` `/invite-codes` `/children`

## enum 값

```typescript
UserRole:          THERAPIST | PARENT
ScheduleStatus:    SCHEDULED | RESCHEDULED | CANCELED | COMPLETED
InviteCodeStatus:  ACTIVE | USED | EXPIRED | REVOKED
NotificationType:  SCHEDULE_CREATED | SCHEDULE_UPDATED | SCHEDULE_CANCELED
```
