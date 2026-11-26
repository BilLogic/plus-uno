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

## Reading list by task

| Task | Read |
|---|---|
| DS terminology | [`design-system-glossary.md`](../../docs/conventions/design-system-glossary.md) |
| Components or tokens: existence, names, facts (usage, rules, props, variants) | [`components/index.md`](../agent-views/components/index.md) and [`tokens/tokens.md`](../agent-views/tokens/tokens.md), then the component's generated file, `design-system/src/components/<group>/<Name>/index.md` (`<Name>.md` when filed flat): one read answers it, the same text `ds_get` returns and Storybook's Harness tab shows |
| A disabled state | [`patterns/Disabled.md`](../agent-views/patterns/Disabled.md) |
| A slot prop | [`coding.md`](../../docs/engineering/coding.md) § Slot names |
| Animating anything | Foundations › Expression › Motion ([`MotionPhysics.mdx`](../src/styles/MotionPhysics.mdx), then the page for the transition), then [`motion/library.md`](../agent-views/motion/library.md) for the component's event-to-token row and the component's own Motion section in its generated file |
| Adding or changing a sound | Foundations › Expression › Sound ([`SoundOverview.mdx`](../src/styles/SoundOverview.mdx), then `SoundWhenToPlay.mdx`), then the row's Motion section for its `sound` cell; the code half is [`sound.md`](../../docs/engineering/sound.md) |
| Verifying a component's API, or writing a story's code | [`ds-mcp.md`](../../docs/connectors/ds-mcp.md) (`plus-ds` / `npm run ds`) and [`storybook-mcp.md`](../../docs/connectors/storybook-mcp.md) |
| Laying out on the grid, or matching a Figma frame's breakpoint modes | [`Grid.mdx`](../src/styles/Grid.mdx) (`npm run ds -- guide grid`) |
