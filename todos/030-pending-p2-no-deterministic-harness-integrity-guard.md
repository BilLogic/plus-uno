---
status: pending
priority: p2
issue_id: 030
tags: [code-review, harness, tooling]
dependencies: [029]
---

# Outbound fetch has a build gate; harness composition has a monthly LLM sweep

## Problem Statement

`npm run deploy` = `check:fetch && bundle:harness && wrangler deploy`. An uncounted `fetch(` blocks the deploy. Meanwhile the harness — the actual product — has no deterministic gate: dropping a file from SKILL_PATHS is silent, and the link validator cannot see the path style AGENTS.md actually uses. Every P1 in this review is an instance of drift that a modest check would have caught.

## Findings

- `bundle-harness.mjs` guards well against three things: missing repo root (`:53`), a missing listed file (`:63`, "never silently ship a partial rulebook"), and an unbalanced ide-only marker (`:84`). None of these catch omission.
- `SKILL_PATHS` is a hand-maintained literal (`:16-42`). Nothing globs `skills/*/bot.md` or `docs/conventions/*.md` to assert coverage. That is how `article-writing-style.md` ended up in no roster at all.
- `scripts/validate-doc-links.sh` parses only markdown `[text](target)` links. AGENTS.md writes every path as inline code, so ~30 references go unchecked. Proof: `AGENT`S.md:82 cites `src/styles/Spacing.stories.jsx`, which does not exist (real: `design-system/src/styles/…`), and the validator prints "all validation checks passed".
- The nearest equivalent is `.github/workflows/harness-integrity-sweep.yml` — monthly, LLM-judged, and its own checklist (`staleness-sweep.md:9`) tests for a `status: canonical` frontmatter key that no file has ever used.

## Proposed Solutions

1. Extend `validate-doc-links.sh` to backticked paths, and add a SKILL_PATHS coverage assertion (every `skills/*/bot.md` + every convention either bundled or explicitly listed as excluded). Small-medium, deterministic, runs in the existing deploy gate.
2. As above plus a tool-name check (todo 029 solution 2). Medium.
3. Fix `staleness-sweep.md:9` to describe the header format that exists. Small; do this regardless.

## Acceptance Criteria

- [ ] A backticked path that does not resolve fails the check
- [ ] A new skill or convention that is neither bundled nor listed as excluded fails the check
- [ ] The sweep checklist tests something that can pass

## Work Log

- 2026-07-30: Found by architecture review; validator blind spot proven by running it against a known-broken path.
