<!-- Tier: 1 -->

# Design Principles

These principles guide every design and implementation decision across the PLUS platform.

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
