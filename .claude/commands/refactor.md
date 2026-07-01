---
description: 코드 냄새를 찾아 우선순위에 따라 리팩토링을 자동 적용한다
---

Invoke the `refactor` skill to:

1. Scan changed files (or the specified path) for code smells
2. Prioritize: any types → duplicate DTOs → HttpException → missing Logger → FSD violations
3. Apply fixes using the `refactoring-expert` agent
4. Validate with `pnpm lint && pnpm typecheck && pnpm test`

Arguments: $ARGUMENTS (optional: file or directory path to scope the refactor)

Examples:

- `/refactor` — scan all files changed since main
- `/refactor apps/api/src/modules/schedules` — refactor a specific module
- `/refactor apps/web/src/features/create-schedule` — refactor a specific feature
