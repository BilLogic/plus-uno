---
status: pending
priority: p3
issue_id: 010
tags: [code-review, quality]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Consolidate 13 hand-rolled timeout fetches + 7 Notion boilerplate blocks

## Problem
The AbortController/setTimeout/finally scaffold repeats in figma.ts, gmail.ts, blueprint.ts, ds-components.ts, github.ts, mcp-health.ts, events.ts (fetchBytes), read-source.ts; notion.ts additionally rebuilds headers + error-format 7x.

## Proposed solution
src/http.ts: fetchWithTimeout(url, init, ms). notion.ts: module-private notionFetch<T>(env, path, opts) owning headers/timeout/parse/error format. ~120-150 lines saved; error formats can't drift.

## Acceptance
- [ ] tsc clean; per-site timeouts preserved (some differ — keep as args).
