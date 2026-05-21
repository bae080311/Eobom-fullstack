#!/bin/bash
# 수정된 패키지만 lint + typecheck 실행
# 설치: ln -sf ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
set -e

echo "[pre-commit] Running lint and typecheck on changed packages..."
pnpm turbo run lint typecheck --filter='...[HEAD]'
echo "[pre-commit] All checks passed."
