#!/usr/bin/env bash
#
# PostgreSQL 백업. DB 호스트나 CI 어디서든 돈다.
#
#   ./scripts/backup-db.sh [출력_디렉터리]
#
# 환경변수
#   DATABASE_URL        (필수) 대상 DB. BACKUP_DATABASE_URL이 있으면 그쪽이 우선.
#   BACKUP_PASSPHRASE   (선택) 주면 gpg 대칭키로 암호화한다.
#                       아동 이름·치료 메모가 들어 있는 DB다. 덤프를 신뢰할 수 없는
#                       곳(오브젝트 스토리지, CI 아티팩트)에 둔다면 반드시 설정한다.
#   BACKUP_RETENTION_DAYS (선택, 기본 14) 이보다 오래된 덤프를 지운다.
#
# 복원
#   gpg --decrypt eobom-...dump.gpg > restore.dump   # 암호화한 경우만
#   pg_restore --clean --if-exists -d "$DATABASE_URL" restore.dump

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TARGET_URL="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"

if [ -z "$TARGET_URL" ]; then
  echo "오류: DATABASE_URL 또는 BACKUP_DATABASE_URL이 필요합니다." >&2
  exit 1
fi

if ! command -v pg_dump > /dev/null 2>&1; then
  echo "오류: pg_dump을 찾을 수 없습니다. postgresql-client를 설치하세요." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_PATH="$OUTPUT_DIR/eobom-$TIMESTAMP.dump"

# -Fc(custom)는 자체 압축돼 있고 pg_restore로 선택 복원이 된다.
echo "덤프 생성: $DUMP_PATH"
pg_dump --format=custom --no-owner --no-privileges --file="$DUMP_PATH" "$TARGET_URL"

FINAL_PATH="$DUMP_PATH"

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  if ! command -v gpg > /dev/null 2>&1; then
    echo "오류: BACKUP_PASSPHRASE가 설정됐는데 gpg가 없습니다." >&2
    rm -f "$DUMP_PATH"
    exit 1
  fi

  echo "암호화: $DUMP_PATH.gpg"
  printf '%s' "$BACKUP_PASSPHRASE" \
    | gpg --batch --yes --symmetric --cipher-algo AES256 \
          --passphrase-fd 0 --output "$DUMP_PATH.gpg" "$DUMP_PATH"

  # 평문 덤프는 남기지 않는다.
  rm -f "$DUMP_PATH"
  FINAL_PATH="$DUMP_PATH.gpg"
else
  echo "경고: BACKUP_PASSPHRASE가 없어 평문으로 남깁니다. 신뢰할 수 있는 저장소에만 두세요." >&2
fi

echo "완료: $FINAL_PATH ($(du -h "$FINAL_PATH" | cut -f1))"

# 오래된 덤프 정리. -r이 없으면 대상이 없을 때 rm이 인자 없이 실행된다.
find "$OUTPUT_DIR" -maxdepth 1 -type f -name 'eobom-*.dump*' -mtime "+$RETENTION_DAYS" -print0 \
  | xargs -0 -r rm -f

echo "$RETENTION_DAYS일보다 오래된 덤프를 정리했습니다."
