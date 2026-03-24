---
title: "Doc splitting for dynamic context loading — modular files over monoliths"
category: agent-infrastructure
date: 2026-03-23
tags: [context-loading, agent-infrastructure, skills, documentation, performance]
modules: [.agent/, docs/design-system/]
severity: medium
---

## Problem

Agent context windows are finite. Monolithic docs (400+ lines) force agents to load entire files when they only need a fraction — wasting context budget and reducing quality on complex tasks.

Five files were identified as monoliths:
- `PLUS_CHEAT_SHEET.md` (409 lines) — all components + forms + tokens
- `design-system/tokens.md` (352 lines) — all token types
- `design-system/overview.md` (441 lines) — architecture + inventory + conventions
- `.agent/SKILL.md` (242 lines) — identity + routing + conventions + loading order
- Skill references — single files mixing unrelated concerns

## Root Cause

Docs were written for human reading (top-to-bottom narrative) not agent consumption (load-what-you-need). No splitting strategy existed.

## Solution

**Pattern: Index + Modules.** Each monolith becomes a lightweight index file (<20 lines) that links to focused modules. Agents load the index to find what they need, then load only the relevant module.

### Splitting Rules Applied

1. **Split by task context** — "What question is the agent answering?"
   - Styling colors → `tokens-color.md` (not all of `tokens.md`)
   - Building forms → `cheat-forms.md` (not all of `PLUS_CHEAT_SHEET.md`)

2. **Each module gets a load-hint header:**
   ```md
   <!-- Load when: styling colors or choosing palette tokens -->
   ```

3. **Index files are routing tables, not summaries** — just links, no content duplication

4. **Original file paths preserved as indexes** — existing references don't break

### Files Created

| Source (monolith) | Modules (granular) |
|---|---|
| `PLUS_CHEAT_SHEET.md` → index | `cheat-components.md`, `cheat-forms.md`, `cheat-tokens.md` |
| `tokens.md` → index | `tokens/tokens-color.md`, `tokens-spacing.md`, `tokens-typography.md`, `tokens-elevation.md` |
| `overview.md` → index | `architecture.md`, `component-inventory.md`, `conventions-quick-ref.md` |
| `SKILL.md` → lean router | `references/import-conventions.md`, `component-discovery.md`, `loading-order.md` |
| `catch-patterns.md` → index | `catch-ds-compliance.md`, `catch-structural.md` |
| `solution-doc-guide.md` → index | `solution-schema.md`, `escalation-rules.md` |

### Context savings

~100-150 lines loaded per task instead of ~400. Roughly **60-70% reduction** in unnecessary context per agent interaction.

## Prevention

- When creating new docs >150 lines, split by task context from the start
- Auto-generated files (like cheat sheets) should output to split targets, not a single monolith
- Add `<!-- Load when: ... -->` headers to every reference doc
- Skill SKILL.md files should stay compact (<80 lines) — extract operational details to `references/`
