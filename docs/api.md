# API 설계 문서

## 기본 정보

- Base URL: `http://localhost:3001/api`
- 인증: Bearer JWT (Phase 2에서 구현)
- Content-Type: `application/json`

## 엔드포인트 목록

### 인증 (Auth)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/auth/register` | 회원가입 | X |
| POST | `/auth/login` | 로그인 | X |
| POST | `/auth/logout` | 로그아웃 | O |

#### POST /auth/register

**Request:**
```json
{
  "email": "therapist@example.com",
  "password": "password123",
  "name": "김치료",
  "role": "THERAPIST"
}
```

**Response 201:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "clx...",
    "email": "therapist@example.com",
    "name": "김치료",
    "role": "THERAPIST"
  }
}
```

---

### 사용자 (Users)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/users/me` | 내 정보 조회 | O |

---

### 아동 (Children)

| Method | Path | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/children` | 아동 목록 | O | 치료사 |
| GET | `/children/:id` | 아동 상세 | O | 치료사/연결된학부모 |
| POST | `/children` | 아동 등록 | O | 치료사 |
| PUT | `/children/:id` | 아동 수정 | O | 치료사 |
| DELETE | `/children/:id` | 아동 삭제 | O | 치료사 |

---

### 초대 코드 (Invite Codes)

| Method | Path | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| POST | `/invite-codes` | 초대 코드 생성 | O | 치료사 |
| POST | `/invite-codes/use` | 초대 코드 사용 | O | 학부모 |

#### POST /invite-codes

**Request:**
```json
{
  "childId": "clx...",
  "expiresInDays": 7
}
```

**Response 201:**
```json
{
  "id": "clx...",
  "code": "ABC123",
  "expiresAt": "2026-05-28T00:00:00.000Z"
}
```

---

### 일정 (Schedules)

| Method | Path | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/schedules` | 일정 목록 | O | 치료사/학부모 |
| GET | `/schedules/:id` | 일정 상세 | O | 치료사/학부모 |
| POST | `/schedules` | 일정 등록 | O | 치료사 |
| PUT | `/schedules/:id` | 일정 수정 | O | 치료사 |
| DELETE | `/schedules/:id` | 일정 취소 | O | 치료사 |
| POST | `/schedules/:id/confirm` | 일정 확인 | O | 학부모 |

#### GET /schedules (Query Parameters)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| childId | string | 특정 아동의 일정 필터 |
| startDate | ISO 8601 | 시작 날짜 |
| endDate | ISO 8601 | 종료 날짜 |
| status | ScheduleStatus | 상태 필터 |

---

### 알림 (Notifications)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/notifications` | 내 알림 목록 | O |
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 | O |
| PATCH | `/notifications/read-all` | 전체 읽음 처리 | O |

---

## 공통 응답 형식

### 성공 응답

```json
{
  "data": { ... },
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 에러 응답

```json
{
  "statusCode": 400,
  "timestamp": "2026-05-21T00:00:00.000Z",
  "path": "/api/schedules",
  "message": "요청이 잘못되었습니다."
}
```

## 인증 플로우 (Phase 2 예정)

```
1. POST /auth/login → accessToken 반환
2. 이후 모든 요청: Authorization: Bearer {accessToken}
3. 토큰 만료 시: 401 Unauthorized
4. 클라이언트에서 재로그인 요청
```
