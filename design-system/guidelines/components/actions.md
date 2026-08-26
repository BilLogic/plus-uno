---
summary: Which action component to reach for — Button and ButtonGroup, and what neither of them is
---

<!-- Tier: 2 | Load when: choosing a component from the actions group -->

# Actions — which component to reach for

Two components: `Button` and `ButtonGroup`. Generated facts — props, variants,
defaults, tokens — are in `design-system/src/components/actions/index.md` and the
per-component pages beside it. This file answers the question that page cannot:
which one, and when neither.

## The choice

**`Button`** for a single action. It is the only component in the group that
carries a click handler, and it is what the rest of the system composes when it
needs an action: `Modal` and `Jumbotron` build their footers from
`primaryButton` / `secondaryButton`, `Card` from `actionButton`, `InputGroup`
from `InputGroup.Button`. Pass `href` when the
action is really navigation — the component forwards it and renders an anchor,
which keeps middle-click and open-in-new-tab working.

**`ButtonGroup`** for two or more actions that read as one control — a toolbar
above a table, a vertical stack of related commands. It pushes `size`, `style`
and `fill` down to its children so those props are declared once. Give it
`ariaLabel`: it renders `role="group"`, and an unnamed group adds a boundary a
screen reader cannot explain.

## When it is not an action at all

The recurring mistake in this group is using a button for something that is not
an action:

| You want | Reach for | Not |
|---|---|---|
| A value the user picks | `Select`, `RadioButtonGroup` | Buttons with `active` |
| A menu of things to do | `Dropdown` | A Button that opens a div |
| Switching between views | `NavTabs`, `NavPills` | A ButtonGroup of two |
| A setting that applies now | `Switch` | A toggle Button |
| A status on a row | `Badge` | A tiny disabled Button |

`active` on a `Button` adds a CSS class and nothing else. A row of buttons where
one is `active` looks like a segmented control and announces as three unrelated
buttons. If you genuinely need a toggle, declare it: unknown props are spread
onto the rendered element, so `aria-pressed` passes straight through — through a
button config's `props` object when you are inside a `ButtonGroup`.

## Two things that catch people

**The style lists differ.** `Button` accepts thirteen `style` values, including
the five SMART curriculum domains (`social-emotional`, `mastering-content`,
`advocacy`, `relationship`, `technology-tools`) and `default`. `ButtonGroup`
accepts seven — no `default`, no domains. Its `fill` list is four; `Button`'s is
five, the extra one being `text`. Set the narrow ones per button.

**Icon-only buttons are small.** With no `text` and no children, `Button`
renders a square: 28×28 at `small`, 36×36 at `medium`, 48×48 at `large`. Only
`large` clears the 44×44 minimum in
`design-system/guidelines/foundations/accessibility.md`, and none of them get an
accessible name on their own — a string `leadingVisual` renders as an
`aria-hidden` icon.

## Related

- `design-system/src/components/actions/index.md` — generated facts and coverage
- `design-system/guidelines/components/overview.md` — how the authored half grows
- `design-system/guidelines/foundations/accessibility.md` — the WCAG bar
