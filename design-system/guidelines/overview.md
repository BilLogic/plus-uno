---
summary: The staged build — Template, Blocks, Pieces, Polish, Motion — and where each stage's answer comes from
---

# Building a PLUS screen

A screen starts from a template (`@/patterns`) and each choice from its pattern, built in five stages. A brief-shaped `ds_find` query (or three or more component names) returns the kit for the first two stages: the template, the governing patterns, the components and the token roles.

| Stage | What it settles | Where the answer comes from |
|---|---|---|
| **1. Template** | The outer shell (`Frame` with `Sidebar`, `Page`, `Modal`, `Panel`, `Popup`) and what fills each slot | `ds_find` kit answer · `ds guide templates` · [`TemplatesOverview.md`](../agent-views/templates/TemplatesOverview.md) · [`components/index.md`](../agent-views/components/index.md) § Templates |
| **2. Blocks** | The `PatternSection`, `PatternCard`, `PatternTable` and `Form` shells on the grid, and which pattern governs each situation (Filtering, Search, Forms, Common actions, Navigation, Notifications, Indicators, Empty, Loading, Errors, Disabled, Read-only, Overflow) | `ds_find` kit answer · `ds guide <pattern>` · [`PatternsOverview.md`](../agent-views/patterns/PatternsOverview.md) |
| **3. Pieces** | The components inside each slot (`@/components`), their exact props and values, or a local component when the system has no fit | `ds_find` → `ds_get` · [`components/index.md`](../agent-views/components/index.md) · [`local-components.md`](../../docs/engineering/local-components.md) |
| **4. Polish** | Spacing, typography, color, radius and elevation tokens by role, plus copy and accessibility | `ds_tokens("<role>")` · `ds guide <foundation>` · [`foundations/overview.md`](foundations/overview.md) · [`tokens/tokens.md`](../agent-views/tokens/tokens.md) |
| **5. Motion** | Which state changes animate, with `--ds-motion-*` CSS tokens or the `@/patterns` motion helpers (`AreaStage`, `DrillStack`, `useDrillStack`, `SlideViews`, `StepStage`, `FocusedFrameSwitch`, `scrollToSpot`, `callAttention`, `SwapInPlace`, `LoadThenReveal`, `LoadRevealSlot`, `PresenceSlot`, `useMotionReduced`, `SPRINGS`), and whether a sound plays | `ds guide motion` · [`motion/library.md`](../agent-views/motion/library.md) · [`SoundOverview.mdx`](../src/styles/SoundOverview.mdx) |

For Figma input or write-back, start at [`figma/registry-load-gate.md`](figma/registry-load-gate.md), then [`figma/mcp-guide.md`](figma/mcp-guide.md) and [`figma/component-alignment.md`](figma/component-alignment.md).
