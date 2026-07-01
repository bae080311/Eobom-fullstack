# 셸 스크립트 작성 원칙

스킬·에이전트 파일 내 bash 코드 블록 작성 시 반드시 따른다.

## 핵심 규칙

### xargs 사용 시 `-r` 필수

입력이 없을 때 `xargs`가 명령을 실행하지 않도록 항상 `-r` (또는 `--no-run-if-empty`) 을 붙인다.

```bash
# 금지
git diff --name-only | grep "\.ts" | xargs grep -L "pattern"

# 올바름
git diff --name-only | grep "\.ts" | xargs -r grep -L "pattern"
```

### 경로 하드코딩 금지

절대경로(`/Users/<name>/...`)를 스킬·에이전트·규칙 파일에 직접 쓰지 않는다.
`~` 또는 `$HOME`을 사용하거나, `<project-hash>` 같은 플레이스홀더로 표현한다.

```bash
# 금지
/Users/bae/.claude/projects/-Users-bae-Eobom-fullstack/memory/

# 올바름
~/.claude/projects/<project-hash>/memory/
```

### `git checkout -b` 전 브랜치 확인 조건문 필수

현재 브랜치가 `main`일 때만 새 브랜치를 생성한다.

```bash
# 금지
git checkout -b feat/<name>

# 올바름
if [ "$(git branch --show-current)" = "main" ]; then
  git checkout -b feat/<name>
fi
```

### 플래그 중복 금지

같은 플래그를 하나의 명령에 두 번 쓰지 않는다.

```bash
# 금지 (이미 -r이 -rL에 포함됨)
grep -rL "pattern" dir/ --include="*.ts" -r

# 올바름
grep -rL "pattern" dir/ --include="*.ts"
```

## 체크리스트 (스킬 파일 작성 후)

- [ ] `xargs` 사용 시 `-r` 붙었는지
- [ ] 절대경로 하드코딩 없는지
- [ ] `git checkout -b` 앞에 조건문 있는지
- [ ] 플래그 중복 없는지

## [자동 추가 2026-07-01] 셸 스크립트 검증 원칙

- xargs -r 누락, 절대경로 하드코딩, git checkout -b 조건문 부재 3가지가 feat/skills 세션에서 PR 리뷰로 한꺼번에 지적됨
- 발견 경위: session-analyst가 feat→fix 커밋 패턴에서 5개 파일의 초기 오류 감지
