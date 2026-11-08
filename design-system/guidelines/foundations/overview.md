---
summary: The fourteen foundations, in the order they are documented
---

<!-- Tier: 2 -->

# Foundations

The fourteen foundations. A new foundation doc has
exactly one correct slot; a foundation earns a folder only when it needs a second
topic, which today only `content/` does.

| Foundation | Authored | Answers |
|------------|:--------:|---------|
| [tokens.md](tokens.md) | ✅ | Which semantic layer does this value come from? |
| [accessibility.md](accessibility.md) | ✅ | What does WCAG 2.1 AA require here? |
| [content/](content/overview.md) | ◐ | What does this button, error, or empty state say? |
| [Spacing.mdx](../../src/styles/Spacing.mdx) | ✅ | How much padding, margin, gap? |
| [Grid.mdx](../../src/styles/Grid.mdx) | ✅ | Breakpoints and column spans |
| [Colors.mdx](../../src/styles/Colors.mdx) | ✅ | Which color, and what does it mean? |
| [Typography.mdx](../../src/styles/Typography.mdx) | ✅ | Which type class and weight? |
| [motion.md](motion.md) | ✕ | Duration, easing, what may animate |
| [Icons.mdx](../../src/styles/Icons.mdx) | ✅ | Which icon set, which size |
| [Illustrations.mdx](../../src/styles/Illustrations.mdx) | ✅ | Illustration style and assets |
| [Logos.mdx](../../src/styles/Logos.mdx) | ✅ | The marks, clear space, variants |
| [Elevation.mdx](../../src/styles/Elevation.mdx) | ✅ | Which shadow step for which surface |
| [Border.mdx](../../src/styles/Border.mdx) | ✅ | Border widths |
| [Radius.mdx](../../src/styles/Radius.mdx) | ✅ | Corner radius scale |

One file sits outside the fourteen slots on purpose:
[data-visualization.md](data-visualization.md), which names which component
token a chart's non-color foundations (spacing, radius, elevation, stroke,
type, motion) take. It is cross-cutting by nature: chart color has its own
rules on the Color page, so there is no single slot above for "what a chart
does with every other foundation" to live in instead.

**12 of 14 authored, 1 partial, 1 empty.** ✕ means a named empty slot: the file
exists, says so, and promises nothing. That is deliberate — a gap you can see
beats a gap you discover mid-build, and it is not a stub, because there is no
template inviting someone to fill in a heading with `TODO`.

## Page order

Storybook and Figma list the foundations in the same order: Foundations overview, Tokens, Color, Typography, Spacing, Layout & grid, Elevation, Border, Radius, Iconography, Illustrations, Logos, Motion, then Accessibility. Each page follows one shape: hero, contents, the foundation's sections, Accessibility, Related.

## Reading order

Start at [tokens.md](tokens.md). Every other foundation names tokens, and the
decision tree there is what tells you which layer a value belongs to. Token
*names* are generated into `design-system/agent-views/tokens/tokens.md`; the
foundations say which to reach for and why.

## Known drift

Several foundations were written ahead of the SCSS and name tokens that do not
resolve — tracked as `harness-intake` issues (elevation, spacing) and fixed
there, not silently on a move. Read the token list as the authority on names.

## Retiring a twin

A foundation file here that has a Storybook page (`design-system/src/styles/*.mdx`) is a twin, and the page is where it ends up. Color, Elevation, Border, Radius, Spacing, Grid, Typography, Iconography, Illustrations and Logos have gone. One twin per ticket:

1. Move every sentence the page lacks into it, in `FoundationSection` and `FoundationSubsection`, with tables as `RefTable` or `TokenTable`. Write PLUS rules only, in current component names; a sentence that no longer matches the code is fixed or dropped, never carried.
2. Delete the twin. `ds guide <topic>` then reads the page through the page model (`scripts/lib/docs-page.mjs`), locally and on the hosted server alike.
3. Repoint every reference: `git grep` the file name and its path, including `AGENTS.md`, skills, agent docs, script comments and `netlify.toml`. Edits to `AGENTS.md` go to Bill for review.
4. Regenerate (`npm run generate:index`, then whatever `npm run check:harness` names) and run `npm run ds -- guide <topic>`: the answer is the page's text with no JSX.
