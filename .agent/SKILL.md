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
- Reference Loading Order
- Progressive Loading Rule

This skill is the entry point for coding agents working in this repository. It standardizes how agents interpret requests, choose one workflow mode, discover components, and implement work using existing PLUS design-system patterns.

This router is agent-agnostic and works across Cursor, Windsurf, Claude Code, and other coding agents.

## Scope and Integrations

This repository includes:
- Design system source: `packages/plus-ds/src`
- Design system docs: `packages/plus-ds/guidelines`
- Storybook config: `.storybook`
- Token sync and generation scripts: `scripts/sync-figma-tokens.js`, `scripts/generate-all-tokens.js`
- Existing agent guidance: `.agent/AGENT.md`, `.agent/references/*`, `.agent/assets/*`, `.agent/scripts/*`

Integrations available in this repo workflow:
- Figma API token sync via scripts (`FIGMA_FILE_KEY`, `FIGMA_ACCESS_TOKEN`)
- Figma MCP workflow documented in `packages/plus-ds/guidelines/guides/figma-workflow.md`
- Stitch MCP workflow for rapid wireframe generation and PRD-to-structure exploration (runtime-dependent)
- Storybook for component verification (`npm run storybook`)
- GitHub Action token automation (`.github/workflows/sync-figma-tokens.yml`)

Critical MCP integrations:
- Figma MCP: required for design-tool-driven implementation when available in runtime.
- Stitch MCP: required for consulting/iteration wireframe generation when available in runtime.

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
- Reference: `references/learning.md`
- Summary: Understand what exists and how it works.

2. Maintaining Mode
- Reference: `references/maintaining.md`
- Summary: Update the design system itself (not feature-only product work).

3. Consulting Mode
- Reference: `references/consulting.md`
- Summary: Early structure-first concepting and wireframes.

4. Iteration Mode
- Reference: `references/iteration.md`
- Summary: Generate 3-5 variations with tradeoffs.

74. Prototyping Mode
- Reference: `references/prototyping.md`
- Summary: Build high-fidelity, low-rigor proof-of-concepts (disposable code).

5. Finalization Mode
- Reference: `references/finalization.md`
- Summary: Production-ready implementation with all states and accessibility.

## Critical Routing Behavior

Before generating any code, ask these three questions verbatim:
1. "Which scenario are we in: learning, maintaining, consulting, iteration, prototyping, or finalization?"
2. "Are you implementing from a design tool (Figma/etc), or building from scratch?"
3. "What fidelity do you need: structure only, mid-fidelity exploration, high-fidelity prototype, or production-ready?"

Then load only the matching mode file in `references/` and proceed.

## Component Discovery Process

1. Check design-to-code mapping first
- If a design link is provided, fetch design context/screenshot first.
- If Code Connect mapping exists, use that mapping before guessing component usage.

2. Check component documentation
- Start with `packages/plus-ds/guidelines/overview-components.md`
- Then inspect story files: `packages/plus-ds/src/**/*.stories.jsx`
- Use `.storybook/main.js` story globs to locate authoritative examples.

3. Understand hierarchy before implementing
- Primitives/tokens: `packages/plus-ds/src/tokens/*`
- Reusable components: `packages/plus-ds/src/components/*`, `packages/plus-ds/src/forms/*`, `packages/plus-ds/src/DataViz/*`
- Higher-level compositions/specs: `packages/plus-ds/src/specs/*`

4. Decide when to ask vs proceed
- Ask when design intent is ambiguous, target context level is unclear, or multiple component families fit equally.
- Proceed when a direct component/story/spec precedent exists.

## Import Conventions

Use repository-established imports:

- Public package usage:
  - `import '@tutors.plus/design-system/styles'`
  - `import { Button } from '@tutors.plus/design-system'`

- Internal source usage (inside repo):
  - Alias `@` maps to `packages/plus-ds/src` in Storybook and DS Vite config.
  - Example: `import Alert from '@/components/Alert'`

- Export entry points:
  - `packages/plus-ds/src/index.js`
  - `packages/plus-ds/src/components/index.js`
  - `packages/plus-ds/src/forms/index.js`

- Do not import from ad hoc legacy paths unless file history requires it.
- Prefer existing index exports over deep relative traversals.

## Critical Rules (Always Apply)

1. Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
2. Never skip reading component source + story + styles before using unfamiliar components.
3. Use PLUS components/specs first; only fall back to generic framework primitives when no PLUS equivalent exists.
4. When Figma design input exists, fetch design context and screenshot before implementation.
5. When consulting/iteration work is requested and Stitch MCP is available, use it for structured wireframe generation before hand-coding variants.
6. Keep terminology consistent with repo foundations and component naming.
7. Cite concrete repository file paths when proposing or explaining implementation choices.
8. If unsure about a pattern, state uncertainty and ask for clarification instead of guessing.
9. Confirm implementation plan and touched files before large or risky edits.
10. In production/finalization work, include accessibility and interactive states explicitly.
11. Validate in Storybook for visual and prop-level correctness when component behavior is touched.

## Reference Loading Order

- Mode logic: `references/{selected-mode}.md`
- Shared foundations: `references/foundations-guide.md`
- Token specifics: `references/tokens-guide.md`
- Integrations: `references/integrations-guide.md`
- Reference index: `references/index.md`
- Practical lookup content: `references/components-guide.md`, `references/patterns-guide.md`, `references/examples-guide.md`
- Machine-readable indexes: `assets/index-manifest.json`, `assets/foundations-index.json`, `assets/components-index.json`, `assets/patterns-index.json`, `assets/tokens-index.json`, `assets/examples-index.json`, `assets/integrations-index.json`
- Runbooks: `references/local-preview-runbook.md`
- Maintenance/process docs: `scripts/maintenance.md`, `scripts/script-inventory.md`, `scripts/sync-checklist.md`

## Progressive Loading Rule

- Keep context lean: load the selected mode file first, then only the specific reference files needed for that task.
- Do not bulk-load all files in `references/` unless explicitly requested.
- Load `assets/*.json` only when you need exhaustive lookup data (paths, globs, commands, env vars).

## References vs Assets Contract

- `references/`: markdown knowledge intended for context loading (workflows, patterns, mode guidance, integration notes).
- `assets/`: non-markdown output artifacts and templates that may be copied into generated output.
- `assets/README.md` is allowed as policy documentation; do not place operational guidance markdown in `assets/`.
