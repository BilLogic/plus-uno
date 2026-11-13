---
summary: What each component is for, when to reach for it, and how it composes
---

<!-- Tier: 2 -->

# Components

What each component is for, when to reach for it, and how it composes.

PLUS components first. An interactive component's behavior — open/closed
state, focus management, keyboard handling — is built on Base UI
(`@base-ui/react`, headless), styled on `--ds-*` tokens (ADR-037).

Two rules reach every group, each stated once:

- **Disabled states** (explain on press):
  `design-system/guidelines/composition/form-behavior.md` § Unavailable actions
  and fields.
- **Slot names:** `docs/engineering/coding.md` § Slot names.

## Start here — the group overviews

"Which component do I reach for" is answered per group, not in one list:

- [Forms and inputs](forms-and-inputs.md) — fields sorted by the shape of the answer, the select family (`Select`, `PopupSelect`, `FilterMenu`), then the buttons
- Images and icons — `Tile` alone, so its docs page is the whole guidance
- [Labels](labels.md) — `StatusTag`, `DateTag`, `CountTag`, `ChangeTag`, `Tag`, `SmartTag`, `TagGroup` and `Suggestion`
- [Layout and structure](layout-and-structure.md) — the containers
- [Loading](loading.md) — `ProgressBar`, `Skeleton`, `Spinner`, `GenerativeBorder`
- [Messaging](messaging.md) — `SectionMessage`, `Flag`, `Modal`, `Banner`, `InlineMessage`, `EmptyState`, `Spotlight`
- [Navigation](navigation.md) — sorted by what the user moves between
- [Overlays and layering](overlays-and-layering.md) — `Tooltip`, `Popup`, and where every popup opens

Facts about a single component — props, variants, defaults, tokens touched,
related components — are generated from source into each component's own
`index.md` beside it, and each group's `index.md` counts how much authored
guidance exists (#165). Read those for facts.

The authored half — when to use, when not, correct/incorrect pairs,
accessibility — lives in the component's Storybook MDX, which is where the
coverage columns detect it.

## How the authored half grows

**The top of the list was measured, not guessed.** Ranking every public
component by the number of files under the Specs code and `prototypes/` that
imported it from the design system and rendered it (measured before the Specs
code left `main`), the fifteen most-rendered were written first, in #166. Twenty
of the 48 public components were rendered nowhere in either corpus.

**Earned thereafter.** Every other component gets its authored half the first
time an agent gets it wrong — not on a schedule, and not by working down the
ranking. The trigger is a real miss: a hallucinated prop, a component reached
for where another was meant, an accessibility defect that shipped. One miss, one
component, one set of three sections.

The capture path is `uno-maintain`, and the routing is already in its taxonomy:

1. **Intake.** The miss is an *inaccuracy* (the docs say something wrong) or an
   *improvement* (the docs say nothing where they should). Its target is the
   codebase estate's "Storybook inconsistent / bug" row, which fixes
   `design-system/src/**` — the component's MDX. Name the evidence: the session
   or PR where the agent got it wrong.
2. **Draft first.** Write the three sections before anyone judges whether they
   are worth it. That is `uno-maintain`'s standing order, and it is cheap here
   because reading the component source is most of the work either way.
3. **Gated change.** The direct-fix whitelist is typos, broken links, stale dates and pure
   formatting, and nothing else — so authored guidance always ships as a PR
   paired with a PRD, through the review gate.

Method: `skills/uno-maintain/references/method.md`. Nothing is ever stubbed: a
component with no authored half simply has none, and its group's coverage column
says so. An empty section under a real heading would count as covered and say
nothing, which is worse than the gap.
