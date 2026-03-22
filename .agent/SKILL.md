---
name: plus-design-system-router
description: Cross-agent router for working in the PLUS design system repository. Use when an AI coding agent needs to choose one mode (learning, maintaining, consulting, iteration, prototyping, or finalization), discover components, apply design tokens, follow import conventions, and execute design-system workflows across Storybook, Figma MCP, Stitch MCP, and repo scripts.
---

# PLUS Design System Skill Router

## Contents
- Scope and Integrations
- Mode Routing (Mutually Exclusive)
- Critical Routing Behavior
- Component Discovery Process
- Import Conventions
- Critical Rules (Always Apply)
- Fast Path (Returning Agent)
- Reference Loading Order
- Loading Triggers
- Progressive Loading Rule

This skill is the entry point for coding agents working in this repository. It standardizes how agents interpret requests, choose one workflow mode, discover components, and implement work using existing PLUS design-system patterns.

This router is agent-agnostic and works across Cursor, Windsurf, Claude Code, and other coding agents.

## Scope and Integrations

This repository includes:
- Design system source: `design-system/src`
- Design system docs: `design-system/guidelines`
- Storybook config: `.storybook`
- Token sync and generation scripts: `scripts/sync-figma-tokens.js`, `scripts/generate-all-tokens.js`
- Existing agent guidance: `.agent/AGENT.md`, `docs/design-system/*`, `.agent/assets/*`
- Validation scripts: `.agent/skills/po-review/scripts/*`

Integrations available in this repo workflow:
- Figma API token sync via scripts (`FIGMA_FILE_KEY`, `FIGMA_ACCESS_TOKEN`)
- Figma MCP workflow documented in `docs/design-system/guides/figma-workflow.md`
- Stitch MCP workflow for rapid wireframe generation and PRD-to-structure exploration (runtime-dependent)
- Storybook for component verification (`npm run storybook`)
- GitHub Action token automation (`.github/workflows/sync-figma-tokens.yml`)

Critical MCP integrations:
- Figma MCP: required for design-tool-driven implementation when available in runtime.
- Stitch MCP: required for consulting/iteration wireframe generation when available in runtime.
- Playwright MCP: optional/required for capturing external sites to Figma or running browser automation tests.

Figma MCP common calls:
- `get_design_context` / `get_screenshot` (or equivalent `get_code` / `get_image` in other runtimes)
- `get_code_connect_map` (if Code Connect mappings exist)
- `get_variable_defs` for variable inspection

Stitch MCP common usage:
- Generate low/mid-fidelity wireframes from briefs/PRDs.
- Produce 3-5 structural or layout alternatives for iteration workflows.

Fallback behavior:
- If either MCP is unavailable in the current runtime, state that explicitly and continue with repository docs, stories, specs, and scripts.

## Mode Routing (Mutually Exclusive)

Choose exactly one mode per request:

1. Learning Mode
- Reference: `../docs/design-system/modes/learning.md`
- Summary: Understand what exists and how it works.

2. Maintaining Mode
- Reference: `../docs/design-system/modes/maintaining.md`
- Summary: Update the design system itself (not feature-only product work).

3. Consulting Mode
- Reference: `../docs/design-system/modes/consulting.md`
- Summary: Early structure-first concepting and wireframes.

4. Iteration Mode
- Reference: `../docs/design-system/modes/iteration.md`
- Summary: Generate 3-5 variations with tradeoffs.

74. Prototyping Mode
- Reference: `../docs/design-system/modes/prototyping.md`
- Summary: Build high-fidelity, low-rigor proof-of-concepts (disposable code).

5. Finalization Mode
- Reference: `../docs/design-system/modes/finalization.md`
- Summary: Production-ready implementation with all states and accessibility.

## Critical Routing Behavior

**MANDATORY RULE:** Before executing anything from any task from the user, you must read the user's request, try to see if you can fit the task into one of the established modes, and explicitly state your selected Mode. Do not proceed with implementation without determining the correct Mode first.

### Mode Inference (Try First)

If the user's intent clearly maps to one mode, select it and confirm:
- "I'm treating this as **[mode]** work — let me know if you'd prefer a different approach."

Common inference signals:
- "What is…" / "How does…" / "Where is…" → **Learning**
- "Update the component" / "Sync tokens" / "Add to the DS" → **Maintaining**
- "What should the layout be" / "Help me plan the page" → **Consulting**
- "Show me options" / "Compare approaches" → **Iteration**
- "Validate this idea" / "Quick check" / "Hack this together" / "High-fi prototype" → **Prototyping**
- "Build this" / "Implement the design" / Figma link provided → **Finalization**

### Explicit Routing (When Ambiguous)

If the intent is genuinely ambiguous, ask these three questions:
1. "Which scenario are we in: learning, maintaining, consulting, iteration, prototyping, or finalization?"
2. "Are you implementing from a design tool (Figma/etc), or building from scratch?"
3. "What fidelity do you need: structure only, mid-fidelity exploration, high-fidelity prototype, or production-ready?"

Then load only the matching mode file in `references/` and proceed.

### Mode Transitions

When a user's request shifts modes mid-conversation (e.g., consulting → finalization):

1. **Summarize** what was decided in the current mode (selected structure, chosen option, key constraints).
2. **Load** the new mode file. Do not retain the previous mode file — it is no longer relevant.
3. **Carry forward** only the actionable decisions (e.g., "Option B was selected" or "Dashboard layout: KPI strip + split pane"), not the full exploration context.

Common transition paths:
- Consulting → Iteration (structure decided, now exploring styled variations)
- Iteration → Finalization (option selected, now implementing)
- Learning → any mode (user understood enough, now wants to act)
- Consulting → Finalization (structure decided, skipping iteration)

## Component Discovery Process

0. **Mandatory Existing Component Check:** You MUST always check if there is a similar or exact component that already exists within the design system FIRST before starting to implement any new custom component. Do not build from scratch if the design system already provides it.

1. Check design-to-code mapping first
- If a design link is provided, fetch design context/screenshot first.
- If Code Connect mapping exists, use that mapping before guessing component usage.

2. Check component documentation
- Start with `docs/design-system/components.md`
- Then inspect story files: `design-system/src/**/*.stories.jsx`
- Use `.storybook/main.js` story globs to locate authoritative examples.

3. Understand hierarchy before implementing
- Primitives/tokens: `design-system/src/tokens/*`
- Reusable components: `design-system/src/components/*`, `design-system/src/forms/*`, `design-system/src/DataViz/*`
- Higher-level compositions/specs: `design-system/src/specs/*`

4. Decide when to ask vs proceed
- Ask when design intent is ambiguous, target context level is unclear, or multiple component families fit equally.
- Proceed when a direct component/story/spec precedent exists.

## Import Conventions

Use repository-established imports:

- Public package usage:
  - `import '@/styles/main.scss'`
  - `import Button from '@/components/Button'`

- Internal source usage (inside repo):
  - Alias `@` maps to `design-system/src` in Storybook and DS Vite config.
  - Example: `import Alert from '@/components/Alert'`

- Export entry points:
  - `design-system/src/index.js`
  - `design-system/src/components/index.js`
  - `design-system/src/forms/index.js`

- Do not import from ad hoc legacy paths unless file history requires it.
- Prefer existing index exports over deep relative traversals.

## Critical Rules (Always Apply)

1. Never hardcode colors, spacing, typography, radius, or elevation when a token exists. You must always map variable names to explicit compile-ready Design System tokens (e.g., `var(--color-on-surface-state-08)`) instead of using raw Figma literal names (e.g., `var(--State-layers-...)`).
2. **THE CHEAT SHEET IS LAW:** Before you write any React component from `@plus-ds` or apply any CSS variable token, you MUST read `.agent/assets/PLUS_CHEAT_SHEET.md`. Do not guess component names or token values. If it is not in the Cheat Sheet, it does not exist.
3. **NEVER HALLUCINATE LAYOUTS:** When building a new page or screen, you MUST read `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` and use the official structural React formulas (e.g., `<PageLayout>`). Do not write raw HTML flexbox grids for page architecture.
4. **NEVER HALLUCINATE PROPS:** Never skip reading component source + story + styles before using unfamiliar components. You MUST check the component's `.jsx` file or `.stories.jsx` file to verify exact prop names and types before implementing it (e.g., do not guess `primaryAction` instead of `primaryButton`).
5. Use PLUS components/specs first; only fall back to generic framework primitives when no PLUS equivalent exists.
6. When Figma design input exists, fetch design context and screenshot before implementation.
7. When consulting/iteration work is requested and Stitch MCP is available, use it for structured wireframe generation before hand-coding variants.
8. Keep terminology consistent with repo foundations and component naming.
9. Cite concrete repository file paths when proposing or explaining implementation choices.
10. If unsure about a pattern, state uncertainty and ask for clarification instead of guessing.
11. Confirm implementation plan and touched files before large or risky edits.
12. In production/finalization work, include accessibility and interactive states explicitly.
13. Validate in Storybook for visual and prop-level correctness when component behavior is touched.

## Fast Path (Returning Agent)

If you already know the mode and context from a prior turn or the user's request is unambiguous:
1. Load the mode file directly — skip routing questions.
2. Load only the specific guides needed for this task.
3. Do not re-read files already loaded in the current session.

This avoids redundant turns and keeps context lean for experienced agents or continuation work.

## Reference Loading Order

Load files in this order, stopping as soon as you have enough context.

| Layer | File(s) | ~Tokens | When to load |
|-------|---------|---------|--------------|
| Mode logic | `docs/design-system/modes/{selected-mode}.md` | 500-900 | Always — first thing after routing |
| Cheat Sheet | `.agent/assets/PLUS_CHEAT_SHEET.md` | 500 | MANDATORY when writing UI code, using components, or applying tokens. |
| Layout Cheat Sheet | `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` | 300 | MANDATORY when building new pages, dashboards, or modals. |
| Foundations | `../docs/design-system/overview.md` | 150 | Before implementation work |
| Tokens | `../docs/design-system/tokens.md` | 350 | For advanced token architecture (use Cheat Sheet for daily use) |
| Integrations | `../docs/design-system/integrations.md` | 120 | When using Figma/Stitch MCP |
| Components | `../docs/design-system/components.md` | 140 | When selecting DS components |
| Implementation | `../docs/design-system/guides/implementation.md` | 200 | When choosing implementation approach or example |
| JSON indexes | `assets/*.json` | 150-500 each | Only for exhaustive path/glob lookup |
| Runbooks | `../docs/design-system/guides/local-preview.md` | 180 | When building or previewing |
| Maintenance | `../docs/design-system/maintenance/runbook.md`, `../docs/design-system/maintenance/scripts.md`, `../docs/design-system/maintenance/sync-checklist.md` | 300-350 each | When maintaining agent docs |

**Typical task budget:** ~2,000-2,500 tokens (mode + 2-3 guides).
**Worst-case full load:** ~5,500 tokens (all files). Avoid this.

## Loading Triggers

Load additional references reactively based on what comes up in conversation:

| Trigger | Load |
|---------|------|
| User asks to build UI, or mentions tokens, colors, spacing, components, or UI | `.agent/assets/PLUS_CHEAT_SHEET.md` |
| User asks to build a new page, screen, dashboard, or layout | `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` |
| User provides a Figma link or mentions MCP tools | `../docs/design-system/integrations.md` |
| User explicitly asks for component architecture rules | `../docs/design-system/components.md` |
| User asks about build, preview, or deployment | `../docs/design-system/guides/local-preview.md` |
| Agent needs exact file paths, globs, or env vars | Relevant `assets/*-index.json` |
| User asks about repo scripts or token sync | `../docs/design-system/maintenance/scripts.md` |
| Agent is checking for stale docs or maintaining `.agent/` | `../docs/design-system/maintenance/sync-checklist.md` |

## Progressive Loading Rule

- Keep context lean: load the selected mode file first, then only the specific reference files needed for that task.
- Do not bulk-load all files in `references/` unless explicitly requested.
- Load `assets/*.json` only when you need exhaustive lookup data (paths, globs, commands, env vars).
- Once a reference is loaded in the current session, do not re-read it. Treat it as active context for the remainder of the task.
- After mode selection, references from other modes are irrelevant — do not retain or load them.

## References vs Assets Contract

- `references/`: markdown knowledge intended for context loading (workflows, patterns, mode guidance, integration notes).
- `assets/`: non-markdown output artifacts and templates that may be copied into generated output.
- `assets/README.md` is allowed as policy documentation; do not place operational guidance markdown in `assets/`.
