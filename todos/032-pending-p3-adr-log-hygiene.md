---
status: pending
priority: p3
issue_id: 032
tags: [code-review, docs, adr]
dependencies: []
---

# ADR log: superseded decisions still Active, consequences unapplied

## Problem Statement

`docs/knowledge/decisions.md` is the provenance record the whole harness cites. Several entries record a world that no longer exists, and two ADRs define the same term incompatibly while both read Active.

## Findings

- ADR-013 (`:101`) declares it supersedes ADR-001, -007, -008. None had its status flipped: `:12` Active, `:54` Amended, `:62` Active.
- ADR-010 (`:74`) defines Tier 1 as "identity, conventions, principles… via AGENTS.md 'See' references" and Tier 3 as "ephemeral… `.agent/handoffs/` (gitignored)". `loading-order.md:7-12,27-33` defines Tier 1 as two files and Tier 3 as "retrieved live, never cached". Both Active. `.agent/` no longer exists and `validate-doc-links.sh` treats it as a stale-path failure pattern.
- ADR-005 (`:42`) describes `.agent/` as current. Active, no supersession note.
- ADR-017 (`:142`) — "the same treatment applies to `docs/evals/rubrics/`" is unimplemented: all 7 rubrics still carry the retired `source:` Notion URL + `synced:` frontmatter ADR-017 abolished.
- ADR-011 (`:85`) — "SKILL.md files stay under 80 lines" violated 4/6 (uno-prototype 132, uno-research 101, uno-synthesize 97, uno-publish 90). Its ">150 lines must be split" rule is broken by `article-writing-style.md` (536) and decisions.md itself.
- ADR-013's "Pending: ADR for the Pipedream→Cloudflare cutover" was closed by ADR-014 without updating the Pending block.
- ADR-021's consequence "uno-synthesize step 4 queries the blueprint before drafting a PRD" landed only in `SKILL.md:56`, not in `references/method.md` §4 — and method.md is the file the Worker loads, so the bot's PRD path never gets the rule.
- ADR-002/003/004/009/011 cite `_archive/solutions/agent-infrastructure/*.md` — no such files under the harness root.

## Proposed Solutions

1. Status-flip pass + move ADR-021's consequence into method.md + fix the rubric frontmatter. Small-medium.
2. As above plus deciding whether ADR-011's line caps are still policy — 4/6 violations suggests the rule is either dead or the files need splitting. Medium; needs a judgment call, not a fix.

## Acceptance Criteria

- [ ] No superseded ADR reads Active
- [ ] One definition of Tier 1 and Tier 3 across ADR log and loading-order.md
- [ ] ADR-017's rubric consequence applied or the ADR amended to drop it
- [ ] ADR-021's blueprint-first rule reaches the Worker

## Work Log

- 2026-07-30: Found by architecture review; each ADR consequence checked against the files it names.
