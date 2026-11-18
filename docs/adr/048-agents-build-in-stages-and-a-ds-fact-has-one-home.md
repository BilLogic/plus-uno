---
embodiment: ide
summary: Agents build a screen in five stages (Template, Blocks, Pieces, Polish, Motion) and each design-system fact has one authored home; guidelines/composition/ is retired.
status: active
verified: 2026-11-14
---

# ADR-048: Agents build in stages and a DS fact has one authored home (2026-11-14)

**Decision.** Every screen build routes through `design-system/guidelines/overview.md` in five stages — Template, Blocks, Pieces, Polish, Motion — governed by hard rule 7 (`templates-first`). The hand-kept `design-system/guidelines/composition/` folder (`overview.md`, `layout.md`, `hierarchy.md`, `surfaces.md`, `forms.md`, `form-behavior.md`) is deleted, and every pointer to it routes to the corresponding Template or Pattern page (`TemplatesOverview.md`, `Forms.md`, `Disabled.md`, `Loading.md`, `Table/index.md`).

**Why.** On the round-2 `session-review-queue` eval, coding agents passed the escape checker (`check:ds-usage`) with zero escapes while reading 0 of 16 expected Template and Pattern pages. Four always-loaded mandates pointed page builds at `design-system/guidelines/composition/layout.md`, a parallel prose copy of the Templates and Patterns documentation that had already drifted from the live MDX pages (for example, naming `Drawer` after ADR-044 retired it). Retiring `guidelines/composition/` gives each layout, form and state rule one authored home in Storybook MDX, with its generated agent copy and `ds guide` lookup serving agents directly.

**Constraints.** Each design-system rule has one authored home: Storybook MDX for Templates, Patterns, Foundations and component prose, and JSDoc/PropTypes for component and template props. `design-system/guidelines/overview.md` stays a compact ~20-line routing table naming the five stages and where each stage's answer comes from (with the `ds_find` kit answer covering the first two). Renaming the `@/patterns` code barrel is deferred (`#2536`), while agent-facing prose (`components/index.md` § Templates, `ORIENTATION`, and the `ds/page-starts-from-pattern` diagnostic) says Template.

**What would reopen it.** If post-restructure eval runs show that agents reach `overview.md` and the Template/Pattern pages (`reach` rises) without improving `fit`, the next change belongs in the pattern pages' own examples and rules rather than adding a second layer of routing prose.

— Bill, Nov 2026, deciding in #2537 and #2550; recorded by Gemini 4 Argon.
