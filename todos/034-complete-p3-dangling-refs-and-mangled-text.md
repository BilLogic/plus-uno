---
status: pending
priority: p3
issue_id: 034
tags: [code-review, docs, link-rot]
dependencies: [030]
---

# Dangling paths and a botched find/replace, some of it in the live prompt

## Problem Statement

Path references that resolve to nothing, plus a `playground`→`prototypes` replacement that mangled text in files that ship in the bot's prompt and in skill routing-trigger text.

## Findings

Mangled text (4 occurrences in `skills/`, two of them bundled):
- `uno-prototype/bot.md:6` "new prototypes prototypes"; `:14` "scaffold a prototypes"
- `uno-prototype/SKILL.md:9` "scaffold a prototypes" — inside frontmatter `description`, i.e. routing-trigger text
- `uno-prototype/references/method.md:20` "prototypes prototypes"; `decisions.md:49` likewise

Dangling paths (verified by ls):
- `coding.md:29` `design-system/src/forms/index.js` — MISS; forms moved to `components/forms-and-inputs/` in the 2026-07 IA reorg. `coding.md:22` `@/forms` unresolvable. `staleness-sweep.md:29` — the checklist meant to catch this — names the same dead barrel.
- `notion.md:12` `src/agent/mcp.ts`, `src/oauth/notion.ts` — MISS (todo 026)
- `uno-review/references/method.md:31` + `catch-patterns.md:1` `scripts/run-review-checks.sh` — MISS at repo root; real path is skill-relative
- `docs/evals/README.md:12` `agents/uno-bot/REGRESSION.md` — MISS, no "formerly" marker
- `decisions.md:22,29,36,72,86` `_archive/solutions/agent-infrastructure/*.md` — MISS
- `docs/context/product/plus-uno.md:66` `design-system/src/DataViz/` — wrong case; resolves on macOS, breaks on a case-sensitive checkout
- `AGENTS.md:69,71,72,82` use bare `src/` for design-system paths while the rest of the file uses `design-system/src/`. `:71` `src/components/` resolves at root to the Vite SPA — the wrong tree, silently.
- `AGENTS.md:96` cites `components-index.json` for a duplicate check; that file is a path manifest, not a component list. The enumeration lives in `design-system/agent-views/components/index.md`.

## Proposed Solutions

1. Fix the mangled strings and each dangling path. Small.
2. Do it after todo 030 extends the link validator, so the fixes are verified by a check rather than by eye. Small; better sequencing.

## Acceptance Criteria

- [ ] No "prototypes prototypes" / "a prototypes" in skills/ or decisions.md
- [ ] Every path above resolves, or is removed
- [ ] `AGENTS.md` uses one prefix convention for design-system paths

## Work Log

- 2026-07-30: Found by consistency audit; every MISS verified with ls/find.
