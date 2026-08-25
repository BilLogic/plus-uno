<!-- Tier: 1 -->

# Principles

These principles guide every design and implementation decision across the PLUS
platform. They are stated once, here — `guidelines/overview.md` routes to them
rather than restating a shortened set.

## AI Augments Human Judgment

AI is a co-pilot, never the pilot. Surface recommendations, highlight patterns, prompt reflection — but the tutor always makes the final call. Design interfaces that make AI suggestions easy to accept, modify, or dismiss.

## Information Density

Tutors are time-pressured during live sessions. Every pixel earns its place. Prefer data-rich views over decorative whitespace. Remove chrome that doesn't serve the task at hand.

## Progressive Disclosure

Show what matters now; reveal detail on demand. Default views answer the immediate question. Expandable sections, tooltips, and drill-downs serve deeper exploration without cluttering the primary flow.

## Bootstrap-First

Use design system components built on Bootstrap before anything custom. Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design, no Tailwind). When Bootstrap lacks a pattern, extend it — don't replace it.

## Compound Designing

Each iteration should make the next one easier. Document decisions, extract reusable patterns, and write tokens — not one-off styles. Today's prototype becomes tomorrow's component.

## Accessibility by Default

WCAG 2.1 AA is the minimum bar, not a stretch goal. Semantic HTML first, ARIA when needed, keyboard access always. See `foundations/accessibility.md` for specifics.

## Consistency Over Novelty

Reuse existing patterns before inventing new ones. Check the component library and existing pages first. A familiar interaction that's slightly imperfect beats a novel one the tutor has to learn mid-session.

## Use Tokens, Never Hardcode

Every color, spacing value, radius, and elevation comes from a design token. Map to compile-ready variables, not raw hex or pixel values. This keeps theming possible and drift impossible.

## Verify Before You Build

Read component source and stories before using unfamiliar components. Never hallucinate props, layouts, or icon names. If it's not in the cheat sheet, it doesn't exist yet.

## The agent's role

The coding agent is an **implementation assistant**. It faithfully realises
designer intent while enforcing the design system. It does not make UX, IA, or
product decisions.

- Cite concrete files for a recommendation; a claim with no path is a guess.
- Ask for clarification when several component families are equally plausible,
  rather than picking one and building it.

## Implementation

- **PLUS components first** — fall back to generic React-Bootstrap only where no PLUS equivalent exists.
- **Barrel imports** — public components (forms and dataviz included) are named exports from `@/components`; spec shells come from spec group indexes such as `@/specs/Universal/Pages`. There is no `@/specs` root barrel.
- **Figma registries are law** — for design-to-code, load `design-system/figma/component-registry.json` and `token-registry.json` before mapping nodes or tokens.
- **No hallucinated props or layouts** — use the skeletons in `composition/layout.md` and read the source for prop names.
- **Minimal scope** — match surrounding conventions; do not add unrelated changes.

## How this knowledge is organised

- **One responsibility per document** — load only what the task requires; `overview.md` routes.
- **Discovery over duplication** — route to the canonical doc; never copy knowledge into a prompt or a stub.
- **Composable** — foundations, components and composition compose; they do not replace workflow skills, which own Scope → Scaffold → Build → Validate → Register.
