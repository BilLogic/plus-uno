---
summary: The label family — Status tag, Count tag, Tag, TagGroup, Suggestion and AI label — and how to choose between them
---

<!-- Tier: 2 | Load when: choosing a component from the labels group -->

# Labels — which component to reach for

The label family: `StatusTag`, `CountTag`, `Tag`, `TagGroup`, `Suggestion` and
`AiLabel`. Generated facts are in `design-system/src/components/labels/index.md`;
when to use each is on its own docs page.

Three questions choose between the first three:

- **Is it a number?** `CountTag`.
- **Is it the condition something is in, and can that condition change?**
  `StatusTag`, whether the system calculated it or a person set it.
- **Otherwise** (a subject, a person, a category): `Tag`.

`StatusTag` takes `appearance` (neutral, success, warning, danger, info,
discovery, and the five SMART subjects) and `spacing` (default 20, compact 16,
spacious 32). `CountTag` takes `appearance`, `spacing` (default 20, compact 16)
and the `isBold`, `isInverse`, `isDot` and `hasRing` booleans.

Both are read-only: no `onClick`, and no button semantics, because a label sits
inside buttons, tabs and rows and nesting one control inside another is invalid
ARIA. A number that changes while the page is open is not announced by either;
if a change genuinely needs to interrupt, that is `Flag` — see
`design-system/guidelines/components/messaging.md`.

Color is never the whole message: an appearance only changes the palette, so the
text has to say what the label means, per
`design-system/guidelines/foundations/accessibility.md`.

## Related

- `design-system/src/components/labels/index.md` — generated facts and coverage
- `design-system/guidelines/components/loading.md` — showing work in flight
- `design-system/guidelines/components/messaging.md` — messages that need to be read
