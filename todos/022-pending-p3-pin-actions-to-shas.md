---
status: pending
priority: p3
issue_id: 022
tags: [code-review, security, supply-chain]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (loop-engineering change set — security-sentinel)
---

# Pin third-party actions to commit SHAs across all workflows

## Problem
All workflows (new cron sweeps and the pre-existing figma-implement/marketplace ones) reference `actions/checkout@v4` / `actions/setup-node@v4` by mutable tag. A tag-move supply-chain attack executes arbitrary code on runners that hold `GEMINI_SA_PRIVATE_KEY`, `NOTION_API_KEY`, `SLACK_BOT_TOKEN`, and `ANTHROPIC_API_KEY`. The Claude Code CLI npm install is already exact-pinned (2.1.212); the actions are the remaining unpinned executors.

## Proposed solution
Pin each `uses:` to a full commit SHA with the tag as a trailing comment (`uses: actions/checkout@<sha> # v4.x.y`), repo-wide, and note the bump procedure in the automations registry header.

## Acceptance
- [ ] No mutable-tag `uses:` remains in `.github/workflows/` or `.github/actions/`
- [ ] One dispatch run of each cron workflow still green after pinning
