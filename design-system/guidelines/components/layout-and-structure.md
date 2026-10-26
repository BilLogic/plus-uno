---
summary: Nine container components sorted by what is being contained, plus the three pairs that get confused
---

<!-- Tier: 2 | Load when: choosing a component from the layout-and-structure group -->

# Layout and structure — which component to reach for

Nine components: `Accordion`, `Card`, `Carousel`, `Collapse`, `Divider`,
`Jumbotron`, `ListGroup`, `MediaObject`, `ScrollBar`. Generated facts are in
`design-system/src/components/layout-and-structure/index.md`. These are
containers; none of them decide page layout, which is
`design-system/guidelines/composition/layout.md`.

## The choice

| You are containing | Reach for |
|---|---|
| one self-contained block of related content | `Card` |
| a page-opening block with one or two actions | `Jumbotron` |
| a thumbnail beside a paragraph | `MediaObject` |
| a list of items, optionally selectable | `ListGroup` |
| several sections, one or more expanded at a time | `Accordion` |
| one section behind one trigger | `Collapse` |
| content taller than its box | `ScrollBar` |
| a rule between sections | `Divider` |
| rotating slides | `Carousel` |

## The three pairs that get confused

**`Accordion` versus `Collapse`.** `Accordion` manages a *set*: items keyed by
`eventKey`, `defaultActiveKey` or `activeKey` for control, `alwaysOpen` to allow
several at once, `flush` to drop the borders. `Collapse` manages *one* — a single
`trigger` node and its children, with `isOpen` / `defaultOpen` / `onToggle` and
an `icon` you can place left or right. One disclosure is `Collapse`; a set of
them is `Accordion`, and building the set out of Collapses means writing the
mutual-exclusion logic yourself.

**`Card` versus `Jumbotron`.** `Jumbotron` is the page-opening block, one per
page: the page's `h1` `title`, one `description` line, an `actions` slot and
optional `media`, in a raised card (built on the Card pattern) or a full-bleed
band (`container="band"`). `Card` is the repeatable unit: it has `image`,
`header`, `items`, `links` and a single `actionButton`, and takes the
`paddingSize` / `gapSize` / `radiusSize` token props.

**`Card` versus `MediaObject`.** A bordered surface with its own regions is a
card. Media alongside text, aligned six ways via `alignment` and sized by
`mediaSize`, is a `MediaObject` — and it is the one that renders a real heading
element (`h6`) for its `heading`.

## What the containers do and do not give you

**`ListGroup` is not a picker.** It lists links, actions and content, and each
actionable row is its own tab stop. A list of options to pick from is the option
list under a field — `Select`, or `ChoiceGroup` for fewer than five options —
which carries the listbox role and its arrow keys.

**A clickable `Card` is not keyboard reachable.** `onClick` sets a pointer cursor
and attaches a handler; it adds no role, no tab stop and no key handling. Put
the action in `links` or `actionButton`, which render real controls. The same
applies to `MediaObject`, which also takes a bare `onClick`.

**Card and alert titles are not headings.** `Card`'s `title` renders through the
underlying card title, a `div` carrying an `h5` class. Visual weight, no document
structure. If the card starts a section a screen-reader user should be able to
jump to, put a real heading in `children`.

**`ScrollBar` is focusable on purpose.** It sets `tabIndex={0}` and an
`aria-label` (default "Scrollable content") so a keyboard user can scroll it, and
deliberately does *not* add `role="region"` — that would create a landmark, and
several of them would clutter the landmark list. `Scrollspy`'s content container
does the same thing for the same reason.

**`Carousel` hides content behind motion.** It exposes `interval`, `pause`,
`wrap`, `keyboard` and `slide`, so auto-advance can be turned off — and should
be, for anything a user has to read. `design-system/guidelines/foundations/accessibility.md`
requires that essential information never depend on motion.

**`Divider` is decoration.** Its `size` list mixes token sizes (`sm`–`xl`) with
literal pixel values (`1px`–`2.5px`). The pixel strings are aliases for the
token sizes. `2.5px` is deprecated: it maps to `xl` and draws 3px, so use
`size="xl"`. Prefer the token sizes so the rule scales with the rest of the
system.

## Related

- `design-system/src/components/layout-and-structure/index.md` — generated facts and coverage
- `design-system/guidelines/composition/layout.md` — page-level layout
- `design-system/guidelines/composition/surfaces.md` — surfaces and elevation
