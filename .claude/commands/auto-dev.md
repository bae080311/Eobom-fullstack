---
description: Notion 로드맵을 읽고 다음 기능을 자동으로 구현·커밋·푸시·PR까지 완료한다
---

Invoke the `auto-dev` skill to:

1. Read the Notion roadmap (using `read-notion-roadmap` skill)
2. Identify the next feature to implement
3. Implement using api-engineer or web-engineer agents
4. Validate with `pnpm lint && pnpm typecheck && pnpm test`
5. Ship using `git-ship` skill (commit → push → PR)

Arguments: $ARGUMENTS (optional: specific feature name to force-select instead of reading roadmap)
