---
summary: The remaining container components sorted by what is being contained
---

<!-- Tier: 2 | Load when: choosing a component from the layout-and-structure group -->

# Layout and structure — which component to reach for

Four components: `Accordion`, `Carousel`, `ScrollBar`, `VisuallyHidden`.
Generated facts are in
`design-system/src/components/layout-and-structure/index.md`. These are
containers; none of them decide page layout, which is
`design-system/guidelines/composition/layout.md`.

<!-- retired-names-ok: names the retired containers this table maps -->
`Card`, `Divider`, `Collapse`, `Jumbotron`, `ListGroup`, `MediaObject`,
`Scrollspy`, `NavPills` and `Navbar` are retired — they are no longer in this
library (Figma keeps them under Retired). Their replacements:

<!-- retired-names-ok: maps each retired container to its replacement -->
| Retired | Reach for |
|---|---|
| `Card` | the Card/Section frame patterns and slots (`design-system/src/patterns/PatternCard`, `PatternSection`) |
| `Divider` | a token-bound border or rule, styled inline on `--ds-border` / `--ds-border-bold` |
| `Collapse` | `Accordion`, or a Base UI expand behavior |
| `Jumbotron` | `PatternSection` with `level="page"`, or `Banner` / `SectionMessage` |
| `ListGroup` | `DropdownMenu` for actions, or `Table` |
| `MediaObject` | `Avatar` / `Tile` with the text layout primitives |
| `Scrollspy` | `Tabs` or `ProgressTracker` |
| `NavPills` | `Tabs` |
| `Navbar` | the Sidebar pattern (`design-system/src/patterns/Sidebar`), inside `Frame` |

## The choice

| You are containing | Reach for |
|---|---|
| several sections, one or more expanded at a time | `Accordion` |
| content taller than its box | `ScrollBar` |
| rotating slides | `Carousel` |
| content to keep in the accessibility tree but not visible | `VisuallyHidden` |

## What the containers do and do not give you

**`ScrollBar` is focusable on purpose.** It sets `tabIndex={0}` and an
`aria-label` (default "Scrollable content") so a keyboard user can scroll it, and
deliberately does *not* add `role="region"` — that would create a landmark, and
several of them would clutter the landmark list.

**`Carousel` hides content behind motion.** It autoplays by default; set
`autoplay={false}` for anything a user has to read. Autoplay holds on hover,
keyboard focus and when out of view, and never runs under reduced motion.
Foundations · Motion (`design-system/src/styles/MotionPrinciples.mdx`) keeps
Reduced mode to a short fade, so essential information never depends on motion.

## Related

- `design-system/src/components/layout-and-structure/index.md` — generated facts and coverage
- `design-system/guidelines/composition/layout.md` — page-level layout
- `design-system/guidelines/composition/surfaces.md` — surfaces and elevation
