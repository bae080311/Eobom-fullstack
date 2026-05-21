# Prisma 마이그레이션 규칙

schema.prisma 수정 시 반드시 이 규칙을 따른다.

## 핵심 원칙

- **필드 삭제 금지** — deprecate 마킹 후 일정 기간 경과 후 제거
- **필드 이름 변경 금지** — 신규 추가 → backfill → 구 필드 deprecate 순서
- **1 PR = 1 마이그레이션** — 롤백 식별성 확보

## Expand-Migrate-Contract 패턴

모든 스키마 변경은 3단계로 분리한다.

1. **Expand** — 새 nullable 필드·테이블 추가 (non-breaking, 기존 코드 무변경)
2. **Migrate** — 애플리케이션 코드를 새 필드로 전환, backfill 실행
3. **Contract** — 구 필드·테이블 DROP (별도 PR, 실행 전 백업 필수)

## 위험 항목

| 변경 | 위험도 | 대응 |
|------|--------|------|
| NOT NULL 필드 추가 | 높음 | default 또는 backfill 먼저 |
| enum 값 제거 | 높음 | 기존 레코드 스캔 후 제거 |
| 테이블 삭제 | 매우 높음 | pg_dump 백업 필수 |
| 인덱스 삭제 | 중간 | 슬로우 쿼리 모니터링 |
