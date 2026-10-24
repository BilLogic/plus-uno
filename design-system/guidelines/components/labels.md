---
summary: The label family — Status, Count, Tag, TagGroup, Suggestion and AI label — and the deprecated Badge it replaces
---

<!-- Tier: 2 | Load when: choosing a component from the labels group -->

# Labels — which component to reach for

The label family: `Status`, `Count`, `Tag`, `TagGroup`, `Suggestion` and
`AiLabel`. They keep their own names in Storybook rather than Atlassian's. Generated facts are in `design-system/src/components/labels/index.md`;
when to use each is on its own docs page.

`Badge` and `BadgeVariants` are deprecated in favor of `Status`, `Count` and
`Tag`. They still render, and warn in development with the replacement for
their props. The rest of this file describes `Badge` for the calls that have not
moved yet.

## Badge, while it lasts

`Badge` is the second most used component in the repo after `Button`, almost
always as a status chip in a table row or a card header. It is read-only by
design: no `onClick`, and no button semantics on the badge itself, because the
only interactive part is the X that `dismissible` adds — nesting one control
inside another is invalid ARIA, and the source says so.

**`Badge`'s `size` is a type scale, not a physical size.** It selects `h1`–`h6`
or `b1`–`b3` (default `b2`), so `size="h1"` is a badge with heading-sized text,
not a bigger pill. And its `style` list has eleven values — no `default`, unlike
`Button` — five of which are SMART curriculum domains that carry no severity
meaning.

`Badge`'s `counter` is a plain span with no live region, so a number that changes
while the page is open is not announced. If a change genuinely needs to
interrupt, that is `Toast` — see `design-system/guidelines/components/messaging.md`.

Color is never the whole message: `Badge`'s style only changes the palette, so
the text has to say what the badge means, per
`design-system/guidelines/foundations/accessibility.md`.

## Related

- `design-system/src/components/labels/index.md` — generated facts and coverage
- `design-system/guidelines/components/loading.md` — showing work in flight
- `design-system/guidelines/components/messaging.md` — messages that need to be read
