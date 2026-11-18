---
embodiment: ide
summary: Dimensions is the one rem ladder that every gap, size, radius and stroke reads from; the Layout foundation (Dimensions, Spacing, Grid) owns it.
status: active
verified: 2026-11-18
---

# ADR-052: Dimensions is the one ladder, and Layout owns it (2026-11-18)

**Decision.** Every length on a page is a dimension primitive, or is computed from them (a column width, a fill). The primitives are one rem ladder named in basis points (`100` is 1 rem, 16 px; `025` is 4 px). Spacing, sizing, radius and stroke are what you measure with it, not four scales. The Foundations › Layout group owns the ladder and splits the facts three ways: **Dimensions** (the ladder, fine primitives, heights snapping to 4, the five core sizes 16 · 24 · 32 · 40 · 48, every size role, controls side by side, building a control), **Spacing** (pad, stack, inline and gutter, and each template's spacing tokens) and **Grid** (breakpoints, the content grid and the screen grid, content widths, the frame, column spans, card widths, modal widths, hug and fill). Radius and Border keep corners and strokes and link back to Dimensions.

**Why.** The ladder already existed in code (`--size-*`, `--height-*`, `--width-*`, `--stroke-*` and the radius steps all alias the `--space-*` primitives) but it had no name and no page. Size roles sat on Grid, template sizes on Spacing and icon sizes on Iconography, so a designer had no single "reach for these first" list and no rule that a height must land on 4. Naming the ladder gives one owner for each fact and removes the "three kinds of box" vocabulary from Spacing.

**Consequences.** Size roles move from Grid to Dimensions, and the old Grid size-roles anchor redirects there. `documentation-ia.md` § Which Foundations page owns what gains the Dimensions row. A new fixed height is added to the ladder first, then to a role. A value off the 4 px grid is allowed only as a fine primitive (1, 2, 6 and 10) inside a component, never in a template.

**What would reopen it.** A second, independent scale that no primitive can express (for example a type scale that must not follow the user's root font size), or a platform where the rem root cannot be 16 px.

— Bill, Nov 2026, spec #2718 and the Layout docs ticket #2728; recorded by Claude Sonnet 5.5.
