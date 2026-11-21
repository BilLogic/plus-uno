---
summary: The staged build — Template, Blocks, Pieces, Polish, Motion — and where each stage's answer comes from
---

# Building a PLUS screen

A screen starts from a template (`@/templates`) and each choice from its pattern, built in five stages. A brief-shaped `ds_find` query (or three or more names) returns the kit: the template, the governing patterns, the components and the token roles.

| Stage | What it settles | Where the answer comes from |
|---|---|---|
| **1. Template** | The shell and overlays (`Frame`, `Page`, `Modal`, `Panel`, `Popup`) and what fills each slot | `ds_find` kit answer · `ds guide templates` · [`TemplatesOverview.md`](../agent-views/templates/TemplatesOverview.md) · [`components/index.md`](../agent-views/components/index.md) § Templates |
| **2. Blocks** | The `Section`, `Card` and `Table` shells on the grid, and which pattern governs each situation (Filtering, Search, Forms, Common actions, Navigation, Notifications, Indicators, Empty, Loading, Errors, Disabled, Read-only, Overflow) | `ds_find` kit answer · `ds guide <pattern>` · [`PatternsOverview.md`](../agent-views/patterns/PatternsOverview.md) |
| **3. Pieces** | The components in each slot (`@/components`), their props and values, or a local component when none fits | `ds_find` → `ds_get` · [`components/index.md`](../agent-views/components/index.md) · [`local-components.md`](../../docs/engineering/local-components.md) |
| **4. Polish** | Spacing, typography, color, radius and elevation tokens by role, and copy and accessibility | `ds_tokens("<role>")` · `ds guide <foundation>` · [`foundations/overview.md`](foundations/overview.md) · [`tokens/tokens.md`](../agent-views/tokens/tokens.md) |
| **5. Motion** | Which state changes animate, with `--ds-motion-*` tokens or the `@/templates` motion helpers (`AreaStage`, `DrillStack`, `useDrillStack`, `SlideViews`, `StepStage`, `scrollToSpot`, `callAttention`, `SwapInPlace`, `LoadThenReveal`, `LoadRevealSlot`, `PresenceSlot`, `useMotionReduced`, `SPRINGS`), and whether a sound plays | `ds guide motion` · [`motion/library.md`](../agent-views/motion/library.md) · [`SoundOverview.mdx`](../src/styles/SoundOverview.mdx) |

For Figma input or write-back, start at [`figma/registry-load-gate.md`](figma/registry-load-gate.md), then [`figma/mcp-guide.md`](figma/mcp-guide.md) and [`figma/component-alignment.md`](figma/component-alignment.md).
