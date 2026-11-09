---
summary: What each component is for, when to reach for it, and how it composes
---

<!-- Tier: 2 -->

# Components

What each component is for, when to reach for it, and how it composes.

PLUS components first. An interactive component's behavior — open/closed
state, focus management, keyboard handling — is built on Base UI
(`@base-ui/react`, headless), styled on `--ds-*` tokens; React-Bootstrap is no
longer the fallback for that behavior (ADR-037).

## Start here — the group overviews

Groups follow Atlassian's component categories, in Atlassian's order, and
"which component do I reach for" is answered per group, not in one list:

- [Forms and inputs](forms-and-inputs.md) — fields sorted by the shape of the answer, then `Button`, `ButtonGroup` and `CloseButton`
- Images and icons — `Tile` alone, so its docs page is the whole guidance
- [Labels](labels.md) — `StatusTag`, `CountTag`, `Tag`, `TagGroup` and `Suggestion`
- [Layout and structure](layout-and-structure.md) — nine containers
- [Loading](loading.md) — `Progress`, `Skeleton`, `Spinner`
- [Messaging](messaging.md) — `Alert`, `Flag`, `Modal`, `Banner`, `InlineMessage`
- [Navigation](navigation.md) — six, sorted by what the user moves between
- [Overlays and layering](overlays-and-layering.md) — `Tooltip`, `Popover`

Storybook titles components with Atlassian's display names (Text field,
Toggle, Section message, Popup); code exports keep theirs. Each group
overview names its own pairs.

## Name map

Where PLUS names a thing differently from atlassian.design, the row says why.
Confirmed rows only; the terms are defined in `GLOSSARY.md`. Atlassian is the
benchmark for every page, so a name that matches it needs no row.

| Our name | ADS name | Why different |
| :--- | :--- | :--- |
| Frame (pattern) | Root | The app's outer shell, the layout's root area that holds the rest |
| Sidebar (pattern) | Side nav | One word |
| Page (pattern) | Main | The content area inside the Frame, with the page title |
| Panel (area) | Panel | Same name; the app-level area at the right of the Frame, holding AI chat first |
| Frame (informal) | none | "App shell" is an informal alias in talk only; code and docs say Frame |
| Section detail (region) | none | A region PLUS adds to Section: a record opens beside its list, 7 + 5 columns |
| Docked | Inline (side nav mode) | We say docked for a Sidebar or Panel that sits beside the Page and moves it |
| Peek | Flyout (side nav mode) | We say peek for a closed Sidebar, or a closed Panel with `panelPeek`, shown over the Page, which does not move |
| Splitter | Splitter | Same name; the draggable edge that resizes the docked Panel |
| Blanket (pattern) | Blanket | Same name; here it also sets the width of what sits on it, in screen-grid columns |
| Modal (pattern) | none | The pattern is the blanket plus a layer; ADS has only the dialog component |
| Modal (component) | Modal dialog | Built on the Modal pattern |
| Status tag | Lozenge | Named for what it shows, a state, in the label family |
| Count tag | Badge | Named for what it shows, a number, in the label family |
| Tag | Tag | Same name and role |
| Tag group | Tag group | Same name and role |
| Suggestion | none | Offers what the AI proposes, accepted or dismissed |
| Drawer (pattern) | Drawer | Kept as a PLUS pattern; its docs say it is a PLUS addition |
| `appearance` | `appearance` | Same prop; values carry meaning (`default`, `subtle`, `primary`) |
| `spacing` | `spacing` | Density in words: `default`, `compact`, `spacious`; pixel values stay on `size` |

Facts about a single component — props, variants, defaults, tokens touched,
related components — are generated from source into each component's own
`index.md` beside it, and each group's `index.md` counts how much authored
guidance exists (#165). Read those for facts.

The authored half — when to use, when not, correct/incorrect pairs,
accessibility — lives in the component's Storybook MDX, which is where the
coverage columns detect it.

## How the authored half grows

**The top of the list was measured, not guessed.** Ranking every public
component by the number of files under `design-system/src/specs/` and
`prototypes/` that import it from the design system and render it, the leaders
are: `Button` (139 files), `Badge` (60), `Modal` (29), `Select` (24),
`Dropdown` (17), `ButtonGroup` (17), `Card` (14), `Pagination` (14),
`NavTabs` (11), `Alert` (11), `TextField` (10), `TextArea` (9), `Checkbox` (9),
`Tooltip` (8), `Switch` (7). Those fifteen were written first, in #166. Twenty
of the 48 public components are rendered nowhere in either corpus.

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
