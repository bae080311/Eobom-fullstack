---
name: prisma-migration
description: Prisma 스키마 변경을 expand-migrate-contract 패턴으로 안전하게 수행
metadata:
  type: process
  version: "1.0.0"
---

# Prisma Migration Skill

`/plan-migration` 커맨드와 `schema.prisma` 편집 시 자동 적용된다.

## 핵심 원칙 (Notion 4.3 기준)

- **필드 삭제 금지**: 먼저 deprecate 마킹 → 일정 기간 경과 후 제거
- **필드 이름 변경 금지**: 신규 추가 → backfill → 구 필드 deprecate
- **1 PR = 1 마이그레이션**: 롤백 식별성 확보
- 모든 시각은 UTC로 저장 (`RecurringRule.timezone` 에만 IANA TZ 보관)

## Expand-Migrate-Contract 패턴

### Expand (확장)
- 새 nullable 필드·테이블·관계 추가 (non-breaking)
- 기존 코드·데이터 변경 없음
- 완료 후: `pnpm prisma:generate && pnpm prisma:migrate`

### Migrate (전환)
- 애플리케이션 코드가 새 필드 사용하도록 전환
- 필요 시 backfill 스크립트 실행
- 구 필드는 이 단계에서 유지

### Contract (수축)
- 구 필드·테이블 DROP (별도 PR)
- 실행 전 반드시 데이터 백업 확인
- 롤백 불가 단계임을 명시

## 위험도 체크리스트

| 변경 유형 | 위험도 | 대응 |
|-----------|--------|------|
| nullable 필드 추가 | 낮음 | 바로 Expand |
| NOT NULL 필드 추가 | 높음 | default 값 또는 backfill 먼저 |
| 인덱스 삭제 | 중간 | 슬로우 쿼리 모니터링 |
| 외래키 변경 | 높음 | 기존 데이터 무결성 확인 |
| enum 값 제거 | 높음 | 기존 레코드 스캔 후 제거 |
| 테이블 삭제 | 매우 높음 | soft delete 검토, 백업 필수 |

## 롤백 계획 템플릿

```bash
# Expand 롤백
pnpm prisma migrate resolve --rolled-back <migration_name>

# Migrate 롤백
git revert <commit>

# Contract 롤백
불가 — 3단계 전 반드시 pg_dump 백업
```
