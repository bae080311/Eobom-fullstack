---
name: git-ship
description: 브랜치 생성·커밋·푸시·PR 자동화. 구현 완료 후 호출한다.
metadata:
  type: process
  version: "1.0.0"
---

# Git Ship Skill

구현이 완료된 기능을 브랜치에 커밋하고 GitHub PR을 생성한다.

## 사전 조건

호출 전 반드시 검증 통과 확인:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

실패 시 git-ship을 실행하지 않고 오류를 수정한다.

## 실행 순서

### 1단계 — 현재 상태 파악

```bash
git status
git diff --stat
git log --oneline -5
git branch --show-current
```

### 2단계 — 브랜치 확인 / 생성

현재 브랜치가 `main` 또는 `feat/*`가 아닌 경우 새 브랜치를 생성한다.

브랜치 명명 규칙:

```
feat/<kebab-case-feature-name>
fix/<kebab-case-bug-name>
refactor/<kebab-case-scope>
```

예시: `feat/children-crud`, `feat/recurring-rule`, `feat/notification-system`

```bash
# 현재 브랜치가 main인 경우에만 새 브랜치 생성
if [ "$(git branch --show-current)" = "main" ]; then
  git checkout -b feat/<feature-name>
fi
```

### 3단계 — 스테이징 및 커밋

변경된 파일을 확인하고 관련 파일만 선택적으로 추가한다 (`.env`, secrets 제외).

커밋 메시지 규칙:

- 형식: `<type>: <한국어 설명>`
- type: `feat` `fix` `docs` `refactor` `test` `chore`
- 예시: `feat: 아동 CRUD 엔드포인트 구현`

```bash
git add <specific-files>
git commit -m "$(cat <<'EOF'
<type>: <설명>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 4단계 — 푸시

```bash
git push -u origin <branch-name>
```

### 5단계 — PR 생성

다음 형식으로 PR을 생성한다:

```bash
gh pr create \
  --title "<type>: <간결한 기능 설명 (영어 또는 한국어, 70자 이내)>" \
  --body "$(cat <<'EOF'
## 변경 사항

- 항목 1
- 항목 2

## 구현 범위

- [ ] 기능 A 구현
- [ ] 기능 B 구현

## 검증

- [ ] `pnpm lint` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과

## 관련 Notion

- [레이어 문서 URL]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 주의 사항

- `main`/`master`에 직접 force push 금지
- `.env`, 시크릿 파일 커밋 금지
- 한 PR에 한 가지 관심사만 (여러 기능 혼합 금지)
- 검증 실패 상태로 PR 생성 금지
