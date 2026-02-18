# PLUS Design Agent

This file is a bootstrap wrapper.

## Canonical Source of Truth

All operational behavior lives in `.agent/SKILL.md`.

Do not run workflows directly from this file. Route through `.agent/SKILL.md` and then load the selected references.

## Non-Negotiable Guardrails

1. Figma MCP is critical: if a Figma link is provided and MCP is available, fetch design context/screenshot before implementation.
2. Stitch MCP is critical: if consulting/iteration wireframing is requested and MCP is available, generate structure/options with Stitch before implementation.
3. If MCP tools are unavailable in runtime, state the limitation and continue with repository docs/stories/specs.
4. Prefer PLUS components/specs over generic framework primitives.
5. Use design tokens (`--color-*`, `--size-*`, `--font-*`, `--elevation-*`) over hardcoded visual values.
6. Cite concrete repository file paths when proposing or applying changes.
7. Ask clarifying questions when intent or fidelity is ambiguous.

## Routing Entry

1. Open `.agent/SKILL.md`.
2. Ask routing questions.
3. Select exactly one mode.
4. Load only the relevant `.agent/references/*` files for that mode.
