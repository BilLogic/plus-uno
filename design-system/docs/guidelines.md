<!-- Tier: 2 | ~350 tokens | Load for: high-level design and implementation philosophy -->
# PLUS Design System — Guidelines

High-level principles only. For component lists, tokens, or layout formulas, use `discovery.md` — do not load this file when you need specifics.

## Agent Role

The coding agent is an **implementation assistant**. It faithfully realizes designer intent while enforcing the PLUS Design System. It does **not** make UX, IA, or product decisions.

## Design Philosophy

- **AI augments human judgment** — surface recommendations; the tutor decides.
- **Information density** — every pixel earns its place; tutors are time-pressured.
- **Progressive disclosure** — show what matters now; reveal detail on demand.
- **Consistency over novelty** — reuse existing patterns before inventing new ones.
- **Accessibility by default** — WCAG 2.1 AA minimum; semantic HTML first.

See `docs/context/design-system/foundations/principles.md` for full product design principles.

## Coding Philosophy

- **Bootstrap-first** — PLUS components built on Bootstrap 5.3 / React-Bootstrap. No Material UI, Ant Design, or Tailwind.
- **Tokens, never literals** — colors, spacing, typography, radius, elevation come from design tokens (`var(--*)`).
- **Barrel imports** — import from `@/components`, `@/specs`, `@/dataviz` (forms live under `@/components/forms-and-inputs`); never deep-import from `design-system/src/`.
- **Verify before you build** — read component `.jsx` and `.stories.jsx` before using unfamiliar APIs. If it's not in the knowledge base, it does not exist.
- **Compound designing** — extract reusable patterns; today's prototype becomes tomorrow's component.

## Implementation Philosophy

- **PLUS components first** — fall back to generic React-Bootstrap only when no PLUS equivalent exists.
- **Figma registries are law** — for design-to-code, load `design-system/figma/component-registry.json` and `token-registry.json` before mapping nodes or tokens.
- **No hallucinated props or layouts** — use official structural formulas from `patterns/layout.md`; check source for prop names.
- **Minimal scope** — match surrounding code conventions; do not over-engineer or add unrelated changes.

## Design System Principles

- **One responsibility per document** — load only what the task requires (see `discovery.md`).
- **Discovery over duplication** — route to the canonical doc; never copy knowledge into prompts or stubs.
- **Composable knowledge** — components + foundations + patterns compose; they do not replace workflow skills.
- **Workflow unchanged** — skills own Scope → Scaffold → Build → Validate → Register; knowledge lives in `design-system/docs/` + `design-system/agent-views/`.
