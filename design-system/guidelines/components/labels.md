---
summary: The label family — Status tag, Date tag, Count tag, Change tag, Tag, Smart tag, TagGroup and Suggestion — and how to choose between them
---

<!-- Tier: 2 | Load when: choosing a component from the labels group -->

# Labels — which component to reach for

The label family: `StatusTag`, `DateTag`, `CountTag`, `ChangeTag`, `Tag`, `SmartTag`,
`TagGroup` and `Suggestion`. Generated facts are in
`design-system/src/components/labels/index.md`; when to use each is on its own
docs page.

Four questions choose between the first five:

- **Is it a number?** `CountTag`. If the number is a change over time ("+3
  vs last week"), `ChangeTag`: the sign sets the arrow and `goodDirection`
  (up, down, none) sets the tone, so "up is bad" needs no hand-picked color.
- **Is it a due or event date?** `DateTag`, outlined with a fixed icon the app
  picks from the date and the due-soon window.
- **Is it the condition something is in, and can that condition change?**
  `StatusTag`, whether the system calculated it or a person set it.
- **Otherwise** (a subject, a person, a category): `Tag`, or `SmartTag` for a
  SMART competency area, which fixes the Tag color and icon from the subject.

`StatusTag` takes `appearance` (neutral, success, warning, danger, info,
discovery) and `spacing` (default 20, spacious 32). `DateTag` takes
`appearance` (neutral, warning, danger) and the same `spacing`. `CountTag`
takes `appearance`, `spacing` (default 20, compact 16) and the `isBold`,
`isInverse`, `isDot` and `hasRing` booleans.

Both are read-only: no `onClick`, and no button semantics, because a label sits
inside buttons, tabs and rows and nesting one control inside another is invalid
ARIA. A number that changes while the page is open is not announced by either;
if a change genuinely needs to interrupt, that is `Flag` — see
`design-system/guidelines/components/messaging.md`.

Color is never the whole message: an appearance only changes the palette, so the
text has to say what the label means, per
`design-system/src/styles/Accessibility.mdx`.

## Related

- `design-system/src/components/labels/index.md` — generated facts and coverage
- `design-system/guidelines/components/loading.md` — showing work in flight
- `design-system/guidelines/components/messaging.md` — messages that need to be read
