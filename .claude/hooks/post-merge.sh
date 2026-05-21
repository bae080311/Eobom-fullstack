#!/bin/bash
# Prisma 스키마 변경 감지 시 클라이언트 재생성
# 설치: ln -sf ../../.claude/hooks/post-merge.sh .git/hooks/post-merge
if git diff HEAD~1 --name-only | grep -q 'prisma/schema.prisma'; then
  echo "[post-merge] Prisma schema changed — regenerating client..."
  pnpm prisma:generate
fi
