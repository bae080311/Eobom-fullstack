---
description: 방금 완료한 작업을 분석해 토큰 낭비·루프·규칙 위반을 찾고 Flywheel을 자동 업그레이드한다
---

Invoke the `reflect` skill to run a post-task retrospective:

1. Run `session-analyst` agent to detect: token waste patterns, AI loops, rule violations, bugs found
2. Run `flywheel-upgrade` skill to automatically update: Notion 9.8 log, `.claude/rules/` files, memory

Arguments: $ARGUMENTS (optional: feature name for context)

Examples:

- `/reflect` — analyze recent git history
- `/reflect children CRUD` — analyze with specific feature context
